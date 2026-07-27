import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes, Download, FileArchive, Layers3, MapPin, Navigation, Trash2, Upload } from 'lucide-react';
import MapaRota from '../components/mapa/MapaRota';
import useFirestoreDocument from '../hooks/useFirestoreDocument';
import { observeCloudAttachments, saveCloudAttachment, deleteCloudAttachment, downloadDataUrl } from '../services/cloudFiles';
import { parseMapFile } from '../utils/kmz';
import './FTTH.css';

function countByKind(markers = [], kind) { return markers.filter(item => item.kind === kind).length; }
function safeCoordinate(value) { const number = Number(String(value ?? '').replace(',', '.')); return Number.isFinite(number) ? number : null; }

export default function FTTHDetalhes() {
  const { id } = useParams();
  const { item: rede, loading: redeLoading } = useFirestoreDocument('ftthRedes', id);
  const [arquivos, setArquivos] = useState([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapError, setMapError] = useState('');
  const inputRef = useRef();
  useEffect(() => observeCloudAttachments('ftthRedes', id, 'kmz', setArquivos, console.error), [id]);

  if (redeLoading) return <div className="ftth-empty">Carregando rede da nuvem...</div>;
  if (!rede) return <div className="ftth-empty"><h2>Rede FTTH não encontrada</h2><Link to="/ftth">Voltar</Link></div>;

  async function selecionar(e) {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    setLoadingMap(true); setMapError('');
    try {
      const parsed = await parseMapFile(file);
      await saveCloudAttachment({ parentType: 'ftthRedes', parentId: id, category: 'kmz', file, extra: { tracks: parsed.tracks, markers: parsed.markers, trechos: parsed.tracks.length, pontos: parsed.markers.length } });
    } catch (error) { console.error(error); setMapError(error.message || 'Não foi possível ler o arquivo.'); }
    finally { setLoadingMap(false); }
  }

  async function excluir(arq) { if (!confirm('Excluir este arquivo e remover seus elementos do mapa?')) return; await deleteCloudAttachment(arq.id); }

  const fallbackPoint = useMemo(() => {
    const lat = safeCoordinate(rede.latitude), lng = safeCoordinate(rede.longitude);
    return lat !== null && lng !== null ? [{ id: `rede-${rede.id}`, name: rede.nome, description: rede.cidade, kind: 'pop', position: [lat, lng] }] : [];
  }, [rede]);
  const markers = arquivos.flatMap(a => a.markers || []), tracks = arquivos.flatMap(a => a.tracks || []);
  const mapPoints = markers.length ? markers : fallbackPoint;
  const ctoCount = countByKind(markers, 'cto'), splitterCount = countByKind(markers, 'splitter'), popCount = countByKind(markers, 'pop'), postCount = countByKind(markers, 'poste');

  return <div className="ftth-page">
    <Link className="voltar-link" to="/ftth"><ArrowLeft size={17}/> Voltar para FTTH</Link>
    <div className="ftth-cabecalho"><div><span>REDE FTTH</span><h1>{rede.nome}</h1><p>{rede.descricao} · {rede.cidade}</p></div><span className="ftth-status">{rede.status}</span></div>
    <div className="ftth-detail-grid"><section className="ftth-panel"><h2><Boxes size={20}/> Estrutura identificada</h2><div className="ftth-metricas ftth-metricas-5"><div><strong>{ctoCount || rede.ctos || 0}</strong><span>CTOs</span></div><div><strong>{splitterCount}</strong><span>Splitters</span></div><div><strong>{popCount || rede.olts || '—'}</strong><span>POPs / OLTs</span></div><div><strong>{tracks.length || rede.cabos || 0}</strong><span>Trechos</span></div><div><strong>{postCount}</strong><span>Postes</span></div></div></section><section className="ftth-panel"><h2><MapPin size={20}/> Localização</h2><p>{fallbackPoint.length ? `${rede.latitude}, ${rede.longitude}` : 'Coordenadas centrais não informadas.'}</p><p>{rede.observacao || 'Use Minha localização para visualizar sua posição em campo.'}</p></section></div>
    <section className="ftth-panel ftth-map-panel"><div className="ftth-section-head"><div><h2><Layers3 size={20}/> Mapa inteligente da rede</h2><p>CTOs, splitters, POPs, postes e cabos ficam sincronizados na nuvem.</p></div><div className="ftth-map-actions">{loadingMap&&<span className="ftth-loading">Lendo KMZ...</span>}<button className="botao-primario" onClick={()=>inputRef.current?.click()} disabled={loadingMap}><Upload size={17}/> {loadingMap?'Processando...':'Adicionar KMZ/KML'}</button><input ref={inputRef} hidden type="file" accept=".kmz,.kml" onChange={selecionar}/></div></div>{mapError&&<div className="ftth-map-error">{mapError}</div>}<MapaRota points={mapPoints} tracks={tracks} center={fallbackPoint[0]?.position} enableLocation showLayerControl height={560}/><div className="ftth-map-legend"><span><i className="legend-cto">C</i> CTO</span><span><i className="legend-splitter">S</i> Splitter</span><span><i className="legend-pop">P</i> POP/OLT</span><span><b className="legend-primary"/> Cabo primário</span><span><b className="legend-distribution"/> Distribuição</span><span><Navigation size={15}/> Clique em um ponto para navegar</span></div></section>
    <section className="ftth-panel"><div className="ftth-section-head"><div><h2><FileArchive size={20}/> Arquivos KMZ / KML</h2><p>O desenho do mapa fica disponível em qualquer dispositivo.</p></div></div>{arquivos.length===0?<div className="ftth-empty"><FileArchive size={38}/><h3>Nenhum KMZ adicionado</h3></div>:<div className="ftth-files">{arquivos.map(arq=><article key={arq.id}><div><FileArchive/><span><strong>{arq.nome}</strong><small>{(arq.tamanho/1024).toFixed(1)} KB · {arq.trechos||0} trechos · {arq.pontos||0} pontos</small></span></div><div><button title="Baixar KMZ" onClick={()=>downloadDataUrl(arq.dataUrl,arq.nome)}><Download size={17}/></button><button title="Excluir KMZ" className="danger" onClick={()=>excluir(arq)}><Trash2 size={17}/></button></div></article>)}</div>}</section>
  </div>;
}
