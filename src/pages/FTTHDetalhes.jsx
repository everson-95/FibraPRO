import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes, Download, FileArchive, Layers3, MapPin, Navigation, Trash2, Upload } from 'lucide-react';
import MapaRota from '../components/mapa/MapaRota';
import { lerDados, salvarDados } from '../utils/localData';
import { deleteFile, getFile, openStoredFile, saveFile } from '../utils/fileStore';
import { parseMapFile } from '../utils/kmz';
import './FTTH.css';

const KEY = 'fibrapro-ftth-redes';
const EMPTY_MAP = { tracks: [], markers: [], summary: {} };

function countByKind(markers = [], kind) {
  return markers.filter(item => item.kind === kind).length;
}

function safeCoordinate(value) {
  const number = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

export default function FTTHDetalhes() {
  const { id } = useParams();
  const rede = lerDados(KEY).find(r => r.id === id) || (id === 'ftth-malacacheta' ? {
    id: 'ftth-malacacheta', nome: 'Malacacheta', cidade: 'Malacacheta', descricao: 'Rede FTTH urbana', ctos: '0', cabos: '0', status: 'Operacional', latitude: '-17.845', longitude: '-42.076'
  } : null);
  const kmzKey = `fibrapro-ftth-kmz-${id}`;
  const [arquivos, setArquivos] = useState(() => lerDados(kmzKey));
  const [mapData, setMapData] = useState(EMPTY_MAP);
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapError, setMapError] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    let active = true;
    async function carregarArquivosExistentes() {
      if (!arquivos.length) {
        if (active) setMapData(EMPTY_MAP);
        return;
      }
      setLoadingMap(true);
      setMapError('');
      try {
        const parsedList = await Promise.all(arquivos.map(async arq => {
          const stored = await getFile(arq.id);
          if (!stored) return null;
          const file = stored instanceof File ? stored : new File([stored], arq.nome, { type: stored.type || arq.tipo || '' });
          return parseMapFile(file);
        }));
        const valid = parsedList.filter(Boolean);
        const merged = {
          tracks: valid.flatMap(item => item.tracks || []),
          markers: valid.flatMap(item => item.markers || []),
          summary: valid.reduce((acc, item) => {
            Object.entries(item.summary || {}).forEach(([key, value]) => { acc[key] = (acc[key] || 0) + value; });
            return acc;
          }, {})
        };
        if (active) setMapData(merged);
      } catch (error) {
        console.error(error);
        if (active) setMapError(error.message || 'Não foi possível abrir o arquivo no mapa.');
      } finally {
        if (active) setLoadingMap(false);
      }
    }
    carregarArquivosExistentes();
    return () => { active = false; };
  }, [arquivos]);

  if (!rede) return <div className="ftth-empty"><h2>Rede FTTH não encontrada</h2><Link to="/ftth">Voltar</Link></div>;

  async function selecionar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(kmz|kml)$/i.test(file.name)) {
      alert('Selecione um arquivo KMZ ou KML.');
      e.target.value = '';
      return;
    }
    setLoadingMap(true);
    setMapError('');
    try {
      const parsed = await parseMapFile(file);
      const fileId = `ftth-kmz-${id}-${Date.now()}`;
      await saveFile(fileId, file);
      const next = [{
        id: fileId,
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        data: new Date().toISOString(),
        resumo: parsed.summary,
        trechos: parsed.tracks.length,
        pontos: parsed.markers.length
      }, ...arquivos];
      setArquivos(next);
      salvarDados(kmzKey, next);
      setMapData(prev => ({
        tracks: [...parsed.tracks, ...prev.tracks],
        markers: [...parsed.markers, ...prev.markers],
        summary: { ...prev.summary, ...parsed.summary }
      }));
      const ctos = countByKind(parsed.markers, 'cto');
      const splitters = countByKind(parsed.markers, 'splitter');
      const pops = countByKind(parsed.markers, 'pop');
      alert(`KMZ importado: ${parsed.tracks.length} trecho(s), ${ctos} CTO(s), ${splitters} splitter(s) e ${pops} POP(s)/OLT(s).`);
    } catch (error) {
      console.error(error);
      setMapError(error.message || 'Não foi possível ler este arquivo.');
      alert(error.message || 'Não foi possível ler este arquivo.');
    } finally {
      setLoadingMap(false);
      e.target.value = '';
    }
  }

  async function excluir(arq) {
    if (!confirm('Excluir este arquivo e remover seus elementos do mapa?')) return;
    await deleteFile(arq.id);
    const next = arquivos.filter(a => a.id !== arq.id);
    setArquivos(next);
    salvarDados(kmzKey, next);
  }

  const fallbackPoint = useMemo(() => {
    const lat = safeCoordinate(rede.latitude);
    const lng = safeCoordinate(rede.longitude);
    return lat !== null && lng !== null ? [{
      id: `rede-${rede.id}`,
      name: rede.nome,
      description: rede.cidade,
      kind: 'pop',
      position: [lat, lng]
    }] : [];
  }, [rede]);

  const mapPoints = mapData.markers.length ? mapData.markers : fallbackPoint;
  const ctoCount = countByKind(mapData.markers, 'cto');
  const splitterCount = countByKind(mapData.markers, 'splitter');
  const popCount = countByKind(mapData.markers, 'pop');
  const postCount = countByKind(mapData.markers, 'poste');

  return <div className="ftth-page">
    <Link className="voltar-link" to="/ftth"><ArrowLeft size={17} /> Voltar para FTTH</Link>

    <div className="ftth-cabecalho">
      <div><span>REDE FTTH</span><h1>{rede.nome}</h1><p>{rede.descricao} · {rede.cidade}</p></div>
      <span className="ftth-status">{rede.status}</span>
    </div>

    <div className="ftth-detail-grid">
      <section className="ftth-panel">
        <h2><Boxes size={20} /> Estrutura identificada</h2>
        <div className="ftth-metricas ftth-metricas-5">
          <div><strong>{ctoCount || rede.ctos || 0}</strong><span>CTOs</span></div>
          <div><strong>{splitterCount}</strong><span>Splitters</span></div>
          <div><strong>{popCount || rede.olts || '—'}</strong><span>POPs / OLTs</span></div>
          <div><strong>{mapData.tracks.length || rede.cabos || 0}</strong><span>Trechos</span></div>
          <div><strong>{postCount}</strong><span>Postes</span></div>
        </div>
      </section>
      <section className="ftth-panel">
        <h2><MapPin size={20} /> Localização</h2>
        <p>{fallbackPoint.length ? `${rede.latitude}, ${rede.longitude}` : 'Coordenadas centrais não informadas.'}</p>
        <p>{rede.observacao || 'Use o botão Minha localização no mapa para visualizar sua posição em campo.'}</p>
      </section>
    </div>

    <section className="ftth-panel ftth-map-panel">
      <div className="ftth-section-head">
        <div><h2><Layers3 size={20} /> Mapa inteligente da rede</h2><p>O KMZ/KML é desenhado neste mapa com CTOs, splitters, POPs, postes e cabos em camadas separadas.</p></div>
        <div className="ftth-map-actions">
          {loadingMap && <span className="ftth-loading">Lendo KMZ...</span>}
          <button className="botao-primario" onClick={() => inputRef.current?.click()} disabled={loadingMap}><Upload size={17} /> {loadingMap ? 'Processando...' : 'Adicionar KMZ/KML'}</button>
          <input ref={inputRef} hidden type="file" accept=".kmz,.kml,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml" onChange={selecionar} />
        </div>
      </div>
      {mapError && <div className="ftth-map-error">{mapError}</div>}
      <MapaRota points={mapPoints} tracks={mapData.tracks} center={fallbackPoint[0]?.position} enableLocation showLayerControl height={560} />
      <div className="ftth-map-legend">
        <span><i className="legend-cto">C</i> CTO</span>
        <span><i className="legend-splitter">S</i> Splitter</span>
        <span><i className="legend-pop">P</i> POP/OLT</span>
        <span><b className="legend-primary" /> Cabo primário</span>
        <span><b className="legend-distribution" /> Distribuição</span>
        <span><Navigation size={15} /> Clique em um ponto para navegar</span>
      </div>
    </section>

    <section className="ftth-panel">
      <div className="ftth-section-head">
        <div><h2><FileArchive size={20} /> Arquivos KMZ / KML</h2><p>Baixe novamente ou exclua os projetos importados desta rede.</p></div>
      </div>
      {arquivos.length === 0 ? <div className="ftth-empty"><FileArchive size={38} /><h3>Nenhum KMZ adicionado</h3><p>Use o botão acima do mapa para importar o projeto da rede.</p></div> : <div className="ftth-files">
        {arquivos.map(arq => <article key={arq.id}>
          <div><FileArchive /><span><strong>{arq.nome}</strong><small>{(arq.tamanho / 1024).toFixed(1)} KB · {arq.trechos ?? '—'} trechos · {arq.pontos ?? '—'} pontos</small></span></div>
          <div><button title="Baixar KMZ" onClick={() => openStoredFile(arq.id, arq.nome)}><Download size={17} /></button><button title="Excluir KMZ" className="danger" onClick={() => excluir(arq)}><Trash2 size={17} /></button></div>
        </article>)}
      </div>}
    </section>
  </div>;
}
