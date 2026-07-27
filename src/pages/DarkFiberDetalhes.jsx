import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Cable,
  Download,
  Eye,
  FileArchive,
  MapPin,
  Plus,
  Trash2,
  Upload
} from 'lucide-react';
import MapaRota from '../components/mapa/MapaRota';
import OtdrModal from '../components/OtdrModal';
import { buscarDarkFiber, listarDarkFiber } from '../services/darkFiber';
import { lerDados, salvarDados } from '../utils/localData';
import { deleteFile, openStoredFile, saveFile } from '../utils/fileStore';
import { parseMapFile } from '../utils/kmz';
import './DarkFiber.css';

function coordenadaValida(valor) {
  return valor !== '' && valor !== null && valor !== undefined && Number.isFinite(Number(valor));
}

export default function DarkFiberDetalhes() {
  const { id } = useParams();
  const metaKey = `fibrapro-darkfiber-otdr-${id}`;
  const kmzKey = `fibrapro-darkfiber-kmz-${id}`;

  const [item, setItem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [curvas, setCurvas] = useState(() => lerDados(metaKey));
  const [mapFiles, setMapFiles] = useState(() => lerDados(kmzKey));
  const [modal, setModal] = useState(false);
  const [loadingKmz, setLoadingKmz] = useState(false);
  const inputKmz = useRef(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const idLimpo = decodeURIComponent(String(id || '')).trim();

        let registro = await buscarDarkFiber(idLimpo);

        // Fallback: usa a mesma listagem que já funciona na tela principal.
        if (!registro) {
          const todos = await listarDarkFiber();

          registro =
            todos.find(itemDark => String(itemDark.id) === idLimpo) ||
            todos.find(
              itemDark =>
                String(itemDark.id).toLowerCase() === idLimpo.toLowerCase()
            ) ||
            null;
        }

        if (ativo) setItem(registro);
      } catch (erro) {
        console.error('Erro ao carregar circuito Dark Fiber:', erro);
        if (ativo) alert('Não foi possível carregar o circuito do Firebase.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [id]);

  const coordinatePoints = useMemo(() => {
    if (!item) return [];

    const pontos = [];

    if (coordenadaValida(item.latOrigem) && coordenadaValida(item.lngOrigem)) {
      pontos.push({
        label: item.origem || 'Origem',
        position: [Number(item.latOrigem), Number(item.lngOrigem)],
        description: item.rota
      });
    }

    if (coordenadaValida(item.latDestino) && coordenadaValida(item.lngDestino)) {
      pontos.push({
        label: item.destino || 'Destino',
        position: [Number(item.latDestino), Number(item.lngDestino)],
        description: item.rota
      });
    }

    return pontos;
  }, [item]);

  const kmzPoints = mapFiles.flatMap(arquivo =>
    (arquivo.markers || []).map(marcador => ({
      label: marcador.name,
      description: marcador.description,
      position: marcador.position
    }))
  );

  const tracks = mapFiles.flatMap(arquivo => arquivo.tracks || []);
  const points = kmzPoints.length ? kmzPoints : coordinatePoints;

  async function salvarCurva(dados) {
    const arquivoId = `dark-${id}-${Date.now()}`;
    await saveFile(arquivoId, dados.arquivo);

    const curva = {
      ...dados,
      id: arquivoId,
      arquivoNome: dados.arquivo.name,
      arquivoTipo: dados.arquivo.type,
      arquivoTamanho: dados.arquivo.size,
      arquivo: null,
      criadoEm: new Date().toISOString()
    };

    const next = [curva, ...curvas];
    setCurvas(next);
    salvarDados(metaKey, next);
    setModal(false);
  }

  async function excluirCurva(curva) {
    if (!confirm('Excluir esta curva?')) return;
    await deleteFile(curva.id);
    const next = curvas.filter(itemCurva => itemCurva.id !== curva.id);
    setCurvas(next);
    salvarDados(metaKey, next);
  }

  async function enviarKmz(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setLoadingKmz(true);

    try {
      const parsed = await parseMapFile(file);
      const arquivoId = `dark-kmz-${id}-${Date.now()}`;
      await saveFile(arquivoId, file);

      const registro = {
        id: arquivoId,
        nome: file.name,
        tamanho: file.size,
        tipo: file.type,
        criadoEm: new Date().toISOString(),
        tracks: parsed.tracks,
        markers: parsed.markers
      };

      const next = [registro, ...mapFiles];
      setMapFiles(next);
      salvarDados(kmzKey, next);
      alert(`Arquivo carregado: ${parsed.tracks.length} trecho(s) e ${parsed.markers.length} ponto(s) encontrados.`);
    } catch (erro) {
      console.error('Erro ao processar KMZ/KML:', erro);
      alert(erro.message || 'Não foi possível ler o arquivo.');
    } finally {
      setLoadingKmz(false);
    }
  }

  async function excluirKmz(arquivo) {
    if (!confirm('Excluir este KMZ/KML e removê-lo do mapa?')) return;
    await deleteFile(arquivo.id);
    const next = mapFiles.filter(itemArquivo => itemArquivo.id !== arquivo.id);
    setMapFiles(next);
    salvarDados(kmzKey, next);
  }

  if (carregando) {
    return (
      <div className="dark-empty">
        <h2>Carregando circuito...</h2>
        <p>Buscando as informações no Firebase.</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="dark-empty">
        <h2>Circuito não encontrado</h2>
        <Link to="/darkfiber">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="dark-page">
      <Link className="voltar-link" to="/darkfiber">
        <ArrowLeft size={17} /> Voltar para Dark Fiber
      </Link>

      <header className="dark-header">
        <div>
          <span className="pagina-identificacao">Circuito Dark Fiber</span>
          <h1>{item.cliente}</h1>
          <p>{item.rota} · {item.origem || 'Origem'} → {item.destino || 'Destino'}</p>
        </div>
        <span className="dark-status">{item.status}</span>
      </header>

      <div className="dark-detail-grid">
        <section className="dark-panel">
          <h2><Cable size={20} /> Informações</h2>
          <dl>
            <div><dt>Cliente</dt><dd>{item.cliente}</dd></div>
            <div><dt>Fibras</dt><dd>{item.fibras || '—'}</dd></div>
            <div><dt>Cabo</dt><dd>{item.cabo || '—'}</dd></div>
            <div><dt>Observações</dt><dd>{item.observacao || '—'}</dd></div>
          </dl>
        </section>

        <section className="dark-panel">
          <h2><MapPin size={20} /> Coordenadas</h2>
          <dl>
            <div>
              <dt>Origem</dt>
              <dd>{coordenadaValida(item.latOrigem) && coordenadaValida(item.lngOrigem) ? `${item.latOrigem}, ${item.lngOrigem}` : 'Não informada'}</dd>
            </div>
            <div>
              <dt>Destino</dt>
              <dd>{coordenadaValida(item.latDestino) && coordenadaValida(item.lngDestino) ? `${item.latDestino}, ${item.lngDestino}` : 'Não informada'}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="dark-panel">
        <div className="dark-section-head">
          <div>
            <h2><MapPin size={20} /> Mapa do circuito</h2>
            <p>O KMZ/KML carregado é desenhado diretamente neste mapa.</p>
          </div>
          <button
            className="botao-primario"
            onClick={() => inputKmz.current?.click()}
            disabled={loadingKmz}
          >
            <Upload size={17} /> {loadingKmz ? 'Processando...' : 'Adicionar KMZ/KML'}
          </button>
          <input
            ref={inputKmz}
            type="file"
            accept=".kmz,.kml,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml"
            hidden
            onChange={enviarKmz}
          />
        </div>

        <MapaRota points={points} tracks={tracks} />

        {mapFiles.length > 0 && (
          <div className="kmz-list">
            {mapFiles.map(arquivo => (
              <article key={arquivo.id}>
                <div>
                  <FileArchive size={18} />
                  <span>
                    <strong>{arquivo.nome}</strong>
                    <small>{(arquivo.tracks || []).length} trecho(s) · {(arquivo.markers || []).length} ponto(s)</small>
                  </span>
                </div>
                <div>
                  <button onClick={() => openStoredFile(arquivo.id, arquivo.nome)} title="Baixar KMZ/KML">
                    <Download size={17} />
                  </button>
                  <button className="danger" onClick={() => excluirKmz(arquivo)} title="Excluir">
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dark-panel">
        <div className="dark-section-head">
          <div>
            <h2><Activity size={20} /> Curvas OTDR</h2>
            <p>Cadastre medições nos dois sentidos do circuito.</p>
          </div>
          <button className="botao-primario" onClick={() => setModal(true)}>
            <Plus size={17} /> Adicionar curva
          </button>
        </div>

        {curvas.length === 0 ? (
          <div className="dark-empty compact">
            <Activity size={38} />
            <h3>Nenhuma curva OTDR</h3>
          </div>
        ) : (
          <div className="otdr-simple-list">
            {curvas.map(curva => (
              <article key={curva.id}>
                <div>
                  <strong>{curva.fibra} · {curva.comprimentoOnda} nm</strong>
                  <span>{curva.sentido}</span>
                  <small>{curva.arquivoNome}</small>
                </div>
                <div>
                  <button onClick={() => openStoredFile(curva.id)} title="Visualizar">
                    <Eye size={17} />
                  </button>
                  <button onClick={() => openStoredFile(curva.id, curva.arquivoNome)} title="Baixar">
                    <Download size={17} />
                  </button>
                  <button className="danger" onClick={() => excluirCurva(curva)}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <OtdrModal
        aberto={modal}
        aoFechar={() => setModal(false)}
        aoSalvar={salvarCurva}
        origem={item.origem || 'Origem'}
        destino={item.destino || 'Destino'}
      />
    </div>
  );
}