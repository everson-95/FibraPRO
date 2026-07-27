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
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import MapaRota from '../components/mapa/MapaRota';
import OtdrModal from '../components/OtdrModal';
import {
  atualizarDarkFiber,
  buscarDarkFiber,
  listarDarkFiber
} from '../services/darkFiber';
import { lerDados, salvarDados } from '../utils/localData';
import { deleteFile, openStoredFile, saveFile } from '../utils/fileStore';
import { parseMapFile } from '../utils/kmz';
import './DarkFiber.css';

const camposVazios = {
  cliente: '',
  rota: '',
  fibras: '',
  origem: '',
  destino: '',
  latOrigem: '',
  lngOrigem: '',
  latDestino: '',
  lngDestino: '',
  cabo: '',
  status: 'Em uso',
  observacao: ''
};

function coordenadaValida(valor) {
  return valor !== '' && valor !== null && valor !== undefined && Number.isFinite(Number(valor));
}

function normalizarFormulario(registro) {
  return {
    ...camposVazios,
    cliente: registro?.cliente || '',
    rota: registro?.rota || '',
    fibras: registro?.fibras || '',
    origem: registro?.origem || '',
    destino: registro?.destino || '',
    latOrigem: registro?.latOrigem || '',
    lngOrigem: registro?.lngOrigem || '',
    latDestino: registro?.latDestino || '',
    lngDestino: registro?.lngDestino || '',
    cabo: registro?.cabo || '',
    status: registro?.status || 'Em uso',
    observacao: registro?.observacao || ''
  };
}

export default function DarkFiberDetalhes() {
  const { id } = useParams();
  const metaKey = `fibrapro-darkfiber-otdr-${id}`;
  const kmzKey = `fibrapro-darkfiber-kmz-${id}`;

  const [item, setItem] = useState(null);
  const [form, setForm] = useState(camposVazios);
  const [editando, setEditando] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
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

        if (!registro) {
          const todos = await listarDarkFiber();
          registro = todos.find(itemDark => String(itemDark.id) === idLimpo) || null;
        }

        if (ativo) {
          setItem(registro);
          setForm(normalizarFormulario(registro));
        }
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

  function atualizarCampo(campo, valor) {
    setForm(atual => ({ ...atual, [campo]: valor }));
  }

  function iniciarEdicao() {
    setForm(normalizarFormulario(item));
    setEditando(true);
  }

  function cancelarEdicao() {
    setForm(normalizarFormulario(item));
    setEditando(false);
  }

  async function salvarEdicao(evento) {
    evento.preventDefault();

    if (!form.cliente.trim()) return alert('Informe o cliente.');
    if (!form.rota.trim()) return alert('Informe a rota.');

    setSalvandoEdicao(true);

    try {
      const dados = {
        ...form,
        cliente: form.cliente.trim(),
        rota: form.rota.trim()
      };

      await atualizarDarkFiber(id, dados);
      const atualizado = { ...item, ...dados, id: item.id };
      setItem(atualizado);
      setForm(normalizarFormulario(atualizado));
      setEditando(false);
      alert('Alterações salvas com sucesso.');
    } catch (erro) {
      console.error('Erro ao atualizar circuito Dark Fiber:', erro);
      alert('Não foi possível salvar as alterações.');
    } finally {
      setSalvandoEdicao(false);
    }
  }

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

        <div className="dark-header-actions">
          <span className="dark-status">{item.status}</span>
          {!editando && (
            <button className="botao-editar-dark" type="button" onClick={iniciarEdicao}>
              <Pencil size={17} /> Editar
            </button>
          )}
        </div>
      </header>

      {editando ? (
        <form className="dark-panel dark-edit-form" onSubmit={salvarEdicao}>
          <div className="dark-section-head">
            <div>
              <h2><Pencil size={20} /> Editar circuito</h2>
              <p>Altere os dados abaixo sem perder KMZ ou curvas OTDR.</p>
            </div>
          </div>

          <div className="dark-edit-grid">
            <label><span>Cliente *</span><input value={form.cliente} onChange={e => atualizarCampo('cliente', e.target.value)} /></label>
            <label><span>Rota *</span><input value={form.rota} onChange={e => atualizarCampo('rota', e.target.value)} /></label>
            <label><span>Fibras utilizadas</span><input value={form.fibras} onChange={e => atualizarCampo('fibras', e.target.value)} /></label>
            <label><span>Cabo</span><input value={form.cabo} onChange={e => atualizarCampo('cabo', e.target.value)} /></label>
            <label><span>Origem</span><input value={form.origem} onChange={e => atualizarCampo('origem', e.target.value)} /></label>
            <label><span>Destino</span><input value={form.destino} onChange={e => atualizarCampo('destino', e.target.value)} /></label>
            <label><span>Latitude da origem</span><input value={form.latOrigem} onChange={e => atualizarCampo('latOrigem', e.target.value)} /></label>
            <label><span>Longitude da origem</span><input value={form.lngOrigem} onChange={e => atualizarCampo('lngOrigem', e.target.value)} /></label>
            <label><span>Latitude do destino</span><input value={form.latDestino} onChange={e => atualizarCampo('latDestino', e.target.value)} /></label>
            <label><span>Longitude do destino</span><input value={form.lngDestino} onChange={e => atualizarCampo('lngDestino', e.target.value)} /></label>
            <label>
              <span>Status</span>
              <select value={form.status} onChange={e => atualizarCampo('status', e.target.value)}>
                <option>Em uso</option>
                <option>Reservada</option>
                <option>Manutenção</option>
                <option>Encerrada</option>
              </select>
            </label>
            <label className="full"><span>Observações</span><textarea value={form.observacao} onChange={e => atualizarCampo('observacao', e.target.value)} /></label>
          </div>

          <div className="dark-edit-actions">
            <button type="button" className="botao-secundario" onClick={cancelarEdicao} disabled={salvandoEdicao}>
              <X size={17} /> Cancelar
            </button>
            <button type="submit" className="botao-primario" disabled={salvandoEdicao}>
              <Save size={17} /> {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      ) : (
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
              <div><dt>Origem</dt><dd>{coordenadaValida(item.latOrigem) && coordenadaValida(item.lngOrigem) ? `${item.latOrigem}, ${item.lngOrigem}` : 'Não informada'}</dd></div>
              <div><dt>Destino</dt><dd>{coordenadaValida(item.latDestino) && coordenadaValida(item.lngDestino) ? `${item.latDestino}, ${item.lngDestino}` : 'Não informada'}</dd></div>
            </dl>
          </section>
        </div>
      )}

      <section className="dark-panel">
        <div className="dark-section-head">
          <div>
            <h2><MapPin size={20} /> Mapa do circuito</h2>
            <p>O KMZ/KML carregado é desenhado diretamente neste mapa.</p>
          </div>
          <button className="botao-primario" onClick={() => inputKmz.current?.click()} disabled={loadingKmz}>
            <Upload size={17} /> {loadingKmz ? 'Processando...' : 'Adicionar KMZ/KML'}
          </button>
          <input ref={inputKmz} type="file" accept=".kmz,.kml,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml" hidden onChange={enviarKmz} />
        </div>

        <MapaRota points={points} tracks={tracks} />

        {mapFiles.length > 0 && (
          <div className="kmz-list">
            {mapFiles.map(arquivo => (
              <article key={arquivo.id}>
                <div>
                  <FileArchive size={18} />
                  <span><strong>{arquivo.nome}</strong><small>{(arquivo.tracks || []).length} trecho(s) · {(arquivo.markers || []).length} ponto(s)</small></span>
                </div>
                <div>
                  <button onClick={() => openStoredFile(arquivo.id, arquivo.nome)} title="Baixar KMZ/KML"><Download size={17} /></button>
                  <button className="danger" onClick={() => excluirKmz(arquivo)} title="Excluir"><Trash2 size={17} /></button>
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
          <button className="botao-primario" onClick={() => setModal(true)}><Plus size={17} /> Adicionar curva</button>
        </div>

        {curvas.length === 0 ? (
          <div className="dark-empty compact"><Activity size={38} /><h3>Nenhuma curva OTDR</h3></div>
        ) : (
          <div className="otdr-simple-list">
            {curvas.map(curva => (
              <article key={curva.id}>
                <div><strong>{curva.fibra} · {curva.comprimentoOnda} nm</strong><span>{curva.sentido}</span><small>{curva.arquivoNome}</small></div>
                <div>
                  <button onClick={() => openStoredFile(curva.id)} title="Visualizar"><Eye size={17} /></button>
                  <button onClick={() => openStoredFile(curva.id, curva.arquivoNome)} title="Baixar"><Download size={17} /></button>
                  <button className="danger" onClick={() => excluirCurva(curva)}><Trash2 size={17} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <OtdrModal aberto={modal} aoFechar={() => setModal(false)} aoSalvar={salvarCurva} origem={item.origem || 'Origem'} destino={item.destino || 'Destino'} />
    </div>
  );
}
