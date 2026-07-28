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
  Upload,
  Pencil,
  Save,
  X,
  Camera,
  Folder,
  FolderPlus,
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';
import MapaRota from '../components/mapa/MapaRota';
import OtdrModal from '../components/OtdrModal';
import { atualizarDarkFiber, buscarDarkFiber, listarDarkFiber } from '../services/darkFiber';
import { lerDados, salvarDados } from '../utils/localData';
import { deleteFile as deleteLocalFile, getFile, openStoredFile } from '../utils/fileStore';
import { parseMapFile } from '../utils/kmz';
import './DarkFiber.css';
import { criarCaminhoArquivo, deleteFile as deleteStorageFile, uploadFile } from '../services/storage';
import { atualizarAnexo, excluirAnexo, observarAnexos, salvarAnexo } from '../services/anexos';

function coordenadaValida(valor) {
  return valor !== '' && valor !== null && valor !== undefined && Number.isFinite(Number(valor));
}

export default function DarkFiberDetalhes() {
  const { id } = useParams();
  const metaKey = `fibrapro-darkfiber-otdr-${id}`;
  const kmzKey = `fibrapro-darkfiber-kmz-${id}`;

  const [item, setItem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [curvas, setCurvas] = useState([]);
  const [mapFiles, setMapFiles] = useState([]);
  const [curvasLocais, setCurvasLocais] = useState(() => lerDados(metaKey));
  const [mapFilesLocais, setMapFilesLocais] = useState(() => lerDados(kmzKey));
  const [migrando, setMigrando] = useState(false);
  const [modal, setModal] = useState(false);
  const [loadingKmz, setLoadingKmz] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [pastasFotos, setPastasFotos] = useState([]);
  const [pastaFotoAtiva, setPastaFotoAtiva] = useState(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [formulario, setFormulario] = useState({});
  const inputKmz = useRef(null);
  const inputFoto = useRef(null);

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

        if (ativo) {
          setItem(registro);
          setFormulario(registro || {});
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


  useEffect(() => {
    if (!id) return undefined;

    const cancelarCurvas = observarAnexos(
      'darkFiber',
      id,
      'OTDR',
      setCurvas,
      erro => console.error('Erro ao carregar curvas OTDR:', erro)
    );

    const cancelarKmz = observarAnexos(
      'darkFiber',
      id,
      'KMZ',
      setMapFiles,
      erro => console.error('Erro ao carregar KMZ/KML:', erro)
    );

    const cancelarFotos = observarAnexos(
      'darkFiber',
      id,
      'FOTO',
      setFotos,
      erro => console.error('Erro ao carregar fotos:', erro)
    );

    const cancelarPastasFotos = observarAnexos(
      'darkFiber',
      id,
      'FOTO_PASTA',
      setPastasFotos,
      erro => console.error('Erro ao carregar pastas de fotos:', erro)
    );

    return () => {
      cancelarCurvas();
      cancelarKmz();
      cancelarFotos();
      cancelarPastasFotos();
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

  const todosMapFiles = [
    ...mapFiles,
    ...mapFilesLocais.map(arquivo => ({ ...arquivo, local: true }))
  ];

  const kmzPoints = todosMapFiles.flatMap(arquivo =>
    (arquivo.markers || []).map(marcador => ({
      label: marcador.name,
      description: marcador.description,
      position: marcador.position
    }))
  );

  const tracks = todosMapFiles.flatMap(arquivo => arquivo.tracks || []);
  const points = kmzPoints.length ? kmzPoints : coordinatePoints;

  async function salvarCurva(dados) {
    try {
      const storagePath = criarCaminhoArquivo(
        'darkFiber',
        id,
        'otdr',
        dados.arquivo.name
      );

      const upload = await uploadFile(storagePath, dados.arquivo);

      await salvarAnexo({
        parentType: 'darkFiber',
        parentId: id,
        categoria: 'OTDR',
        fibra: dados.fibra,
        sentido: dados.sentido,
        comprimentoOnda: dados.comprimentoOnda,
        distancia: dados.distancia,
        perdaTotal: dados.perdaTotal,
        dataMedicao: dados.dataMedicao,
        equipamento: dados.equipamento,
        observacao: dados.observacao,
        nome: dados.arquivo.name,
        tipo: dados.arquivo.type || '',
        tamanho: dados.arquivo.size,
        url: upload.url,
        storagePath: upload.path
      });

      setModal(false);
    } catch (erro) {
      console.error('Erro ao salvar curva OTDR:', erro);
      alert(erro.message || 'Não foi possível enviar a curva OTDR.');
    }
  }

  async function excluirCurva(curva) {
    if (!confirm('Excluir esta curva?')) return;

    try {
      if (curva.local) {
        await deleteLocalFile(curva.id);
        const next = curvasLocais.filter(itemCurva => itemCurva.id !== curva.id);
        setCurvasLocais(next);
        salvarDados(metaKey, next);
        return;
      }

      await deleteStorageFile(curva.storagePath);
      await excluirAnexo(curva.id);
    } catch (erro) {
      console.error('Erro ao excluir curva:', erro);
      alert('Não foi possível excluir a curva.');
    }
  }

  async function abrirCurva(curva, baixar = false) {
    if (curva.local) {
      await openStoredFile(curva.id, baixar ? curva.arquivoNome : undefined);
      return;
    }

    if (baixar) {
      const link = document.createElement('a');
      link.href = curva.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = curva.nome || 'curva-otdr';
      link.click();
      return;
    }

    window.open(curva.url, '_blank', 'noopener,noreferrer');
  }

  async function enviarKmz(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setLoadingKmz(true);

    try {
      const parsed = await parseMapFile(file);
      const storagePath = criarCaminhoArquivo('darkFiber', id, 'kmz', file.name);
      const upload = await uploadFile(storagePath, file);

      await salvarAnexo({
        parentType: 'darkFiber',
        parentId: id,
        categoria: 'KMZ',
        nome: file.name,
        tamanho: file.size,
        tipo: file.type || '',
        url: upload.url,
        storagePath: upload.path,
        tracks: parsed.tracks,
        markers: parsed.markers
      });

      alert(`Arquivo carregado: ${parsed.tracks.length} trecho(s) e ${parsed.markers.length} ponto(s) encontrados.`);
    } catch (erro) {
      console.error('Erro ao processar KMZ/KML:', erro);
      alert(erro.message || 'Não foi possível ler ou enviar o arquivo.');
    } finally {
      setLoadingKmz(false);
    }
  }

  async function excluirKmz(arquivo) {
    if (!confirm('Excluir este KMZ/KML e removê-lo do mapa?')) return;

    try {
      if (arquivo.local) {
        await deleteLocalFile(arquivo.id);
        const next = mapFilesLocais.filter(itemArquivo => itemArquivo.id !== arquivo.id);
        setMapFilesLocais(next);
        salvarDados(kmzKey, next);
        return;
      }

      await deleteStorageFile(arquivo.storagePath);
      await excluirAnexo(arquivo.id);
    } catch (erro) {
      console.error('Erro ao excluir KMZ/KML:', erro);
      alert('Não foi possível excluir o arquivo.');
    }
  }

  async function abrirKmz(arquivo) {
    if (arquivo.local) {
      await openStoredFile(arquivo.id, arquivo.nome);
      return;
    }

    window.open(arquivo.url, '_blank', 'noopener,noreferrer');
  }

  async function migrarArquivosLocais() {
    if (migrando) return;
    setMigrando(true);

    try {
      for (const curva of curvasLocais) {
        const file = await getFile(curva.id);
        if (!file) continue;

        const storagePath = criarCaminhoArquivo('darkFiber', id, 'otdr', curva.arquivoNome || file.name);
        const upload = await uploadFile(storagePath, file);

        await salvarAnexo({
          parentType: 'darkFiber',
          parentId: id,
          categoria: 'OTDR',
          fibra: curva.fibra || '',
          sentido: curva.sentido || '',
          comprimentoOnda: curva.comprimentoOnda || '',
          distancia: curva.distancia || '',
          perdaTotal: curva.perdaTotal || '',
          dataMedicao: curva.dataMedicao || '',
          equipamento: curva.equipamento || '',
          observacao: curva.observacao || '',
          nome: curva.arquivoNome || file.name,
          tipo: curva.arquivoTipo || file.type || '',
          tamanho: curva.arquivoTamanho || file.size,
          url: upload.url,
          storagePath: upload.path
        });

        await deleteLocalFile(curva.id);
      }

      for (const arquivo of mapFilesLocais) {
        const file = await getFile(arquivo.id);
        if (!file) continue;

        const storagePath = criarCaminhoArquivo('darkFiber', id, 'kmz', arquivo.nome || file.name);
        const upload = await uploadFile(storagePath, file);

        await salvarAnexo({
          parentType: 'darkFiber',
          parentId: id,
          categoria: 'KMZ',
          nome: arquivo.nome || file.name,
          tamanho: arquivo.tamanho || file.size,
          tipo: arquivo.tipo || file.type || '',
          url: upload.url,
          storagePath: upload.path,
          tracks: arquivo.tracks || [],
          markers: arquivo.markers || []
        });

        await deleteLocalFile(arquivo.id);
      }

      setCurvasLocais([]);
      setMapFilesLocais([]);
      salvarDados(metaKey, []);
      salvarDados(kmzKey, []);
      alert('Arquivos locais migrados para a nuvem.');
    } catch (erro) {
      console.error('Erro ao migrar arquivos locais:', erro);
      alert('A migração foi interrompida. Os arquivos não migrados continuam neste dispositivo.');
    } finally {
      setMigrando(false);
    }
  }


  function alterarFormulario(evento) {
    const { name, value } = evento.target;
    setFormulario(anterior => ({ ...anterior, [name]: value }));
  }

  function iniciarEdicao() {
    setFormulario(item || {});
    setEditando(true);
  }

  function cancelarEdicao() {
    setFormulario(item || {});
    setEditando(false);
  }

  async function salvarEdicao(evento) {
    evento.preventDefault();
    setSalvandoEdicao(true);

    try {
      const dados = {
        cliente: formulario.cliente || '',
        rota: formulario.rota || '',
        fibras: formulario.fibras || '',
        cabo: formulario.cabo || '',
        origem: formulario.origem || '',
        destino: formulario.destino || '',
        latOrigem: formulario.latOrigem || '',
        lngOrigem: formulario.lngOrigem || '',
        latDestino: formulario.latDestino || '',
        lngDestino: formulario.lngDestino || '',
        status: formulario.status || 'Em uso',
        observacao: formulario.observacao || '',
        dioOrigem: formulario.dioOrigem || '',
        portaDioOrigem: formulario.portaDioOrigem || '',
        dioDestino: formulario.dioDestino || '',
        portaDioDestino: formulario.portaDioDestino || ''
      };

      await atualizarDarkFiber(id, dados);
      setItem(anterior => ({ ...anterior, ...dados }));
      setFormulario(anterior => ({ ...anterior, ...dados }));
      setEditando(false);
      alert('Circuito atualizado com sucesso.');
    } catch (erro) {
      console.error('Erro ao atualizar circuito:', erro);
      alert('Não foi possível salvar as alterações.');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function criarPastaFotos() {
    const nome = prompt('Nome da pasta de fotos (ex.: SITE - POP MALACACHETA):');
    if (!nome?.trim()) return;

    try {
      await salvarAnexo({
        parentType: 'darkFiber',
        parentId: id,
        categoria: 'FOTO_PASTA',
        nome: nome.trim()
      });
    } catch (erro) {
      console.error('Erro ao criar pasta de fotos:', erro);
      alert('Não foi possível criar a pasta.');
    }
  }

  async function renomearPastaFotos(pasta) {
    const nome = prompt('Novo nome da pasta:', pasta.nome || '');
    if (!nome?.trim() || nome.trim() === pasta.nome) return;

    try {
      await atualizarAnexo(pasta.id, { nome: nome.trim() });
      if (pastaFotoAtiva?.id === pasta.id) {
        setPastaFotoAtiva(anterior => ({ ...anterior, nome: nome.trim() }));
      }
    } catch (erro) {
      console.error('Erro ao renomear pasta:', erro);
      alert('Não foi possível renomear a pasta.');
    }
  }

  async function excluirPastaFotos(pasta) {
    const fotosDaPasta = fotos.filter(foto => foto.pastaId === pasta.id);
    const mensagem = fotosDaPasta.length
      ? `Excluir a pasta "${pasta.nome}" e ${fotosDaPasta.length} foto(s)?`
      : `Excluir a pasta "${pasta.nome}"?`;

    if (!confirm(mensagem)) return;

    try {
      for (const foto of fotosDaPasta) {
        await deleteStorageFile(foto.storagePath);
        await excluirAnexo(foto.id);
      }
      await excluirAnexo(pasta.id);
      if (pastaFotoAtiva?.id === pasta.id) setPastaFotoAtiva(null);
    } catch (erro) {
      console.error('Erro ao excluir pasta de fotos:', erro);
      alert('Não foi possível excluir a pasta.');
    }
  }

  async function enviarFoto(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;

    if (!pastaFotoAtiva || pastaFotoAtiva.id === '__sem_pasta__') {
      alert('Abra uma pasta de fotos antes de adicionar uma imagem.');
      return;
    }

    if (!arquivo.type.startsWith('image/')) {
      alert('Selecione uma imagem.');
      return;
    }

    setUploadingFoto(true);
    try {
      const storagePath = criarCaminhoArquivo(
        'darkFiber',
        id,
        `fotos/${pastaFotoAtiva.id}`,
        arquivo.name
      );
      const upload = await uploadFile(storagePath, arquivo);
      await salvarAnexo({
        parentType: 'darkFiber',
        parentId: id,
        categoria: 'FOTO',
        pastaId: pastaFotoAtiva.id,
        pastaNome: pastaFotoAtiva.nome,
        nome: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size,
        url: upload.url,
        storagePath: upload.path
      });
    } catch (erro) {
      console.error('Erro ao enviar foto:', erro);
      alert('Não foi possível enviar a foto.');
    } finally {
      setUploadingFoto(false);
    }
  }

  async function excluirFoto(foto) {
    if (!confirm('Excluir esta foto?')) return;
    try {
      await deleteStorageFile(foto.storagePath);
      await excluirAnexo(foto.id);
    } catch (erro) {
      console.error('Erro ao excluir foto:', erro);
      alert('Não foi possível excluir a foto.');
    }
  }

  const fotosSemPasta = fotos.filter(foto => !foto.pastaId);
  const fotosDaPastaAtiva = pastaFotoAtiva?.id === '__sem_pasta__'
    ? fotosSemPasta
    : fotos.filter(foto => foto.pastaId === pastaFotoAtiva?.id);


  const todasCurvas = [
    ...curvas,
    ...curvasLocais.map(curva => ({ ...curva, local: true }))
  ];

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
            <button className="botao-primario" onClick={iniciarEdicao}>
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
              <p>Altere os dados e salve no mesmo cadastro.</p>
            </div>
            <div className="dark-edit-actions">
              <button type="button" className="botao-cancelar" onClick={cancelarEdicao}>
                <X size={17} /> Cancelar
              </button>
              <button type="submit" className="botao-primario" disabled={salvandoEdicao}>
                <Save size={17} /> {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>

          <div className="dark-edit-grid">
            {[
              ['cliente', 'Cliente'], ['rota', 'Rota'], ['fibras', 'Fibras'], ['cabo', 'Cabo'],
              ['origem', 'Origem'], ['destino', 'Destino'], ['latOrigem', 'Latitude origem'],
              ['lngOrigem', 'Longitude origem'], ['latDestino', 'Latitude destino'], ['lngDestino', 'Longitude destino'],
              ['dioOrigem', 'DIO origem'], ['portaDioOrigem', 'Porta do DIO origem'],
              ['dioDestino', 'DIO destino'], ['portaDioDestino', 'Porta do DIO destino']
            ].map(([name, label]) => (
              <label key={name}>{label}
                <input name={name} value={formulario[name] || ''} onChange={alterarFormulario} />
              </label>
            ))}
            <label>Status
              <select name="status" value={formulario.status || 'Em uso'} onChange={alterarFormulario}>
                <option>Em uso</option><option>Disponível</option><option>Manutenção</option><option>Inativo</option>
              </select>
            </label>
            <label className="campo-largo">Observações
              <textarea name="observacao" rows="4" value={formulario.observacao || ''} onChange={alterarFormulario} />
            </label>
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
              <div><dt>DIO origem</dt><dd>{item.dioOrigem || '—'}</dd></div>
              <div><dt>Porta DIO origem</dt><dd>{item.portaDioOrigem || '—'}</dd></div>
              <div><dt>DIO destino</dt><dd>{item.dioDestino || '—'}</dd></div>
              <div><dt>Porta DIO destino</dt><dd>{item.portaDioDestino || '—'}</dd></div>
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

        {todosMapFiles.length > 0 && (
          <div className="kmz-list">
            {todosMapFiles.map(arquivo => (
              <article key={arquivo.id}>
                <div>
                  <FileArchive size={18} />
                  <span>
                    <strong>{arquivo.nome}</strong>
                    <small>{(arquivo.tracks || []).length} trecho(s) · {(arquivo.markers || []).length} ponto(s)</small>
                  </span>
                </div>
                <div>
                  <button onClick={() => abrirKmz(arquivo)} title="Abrir KMZ/KML">
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

      {(curvasLocais.length > 0 || mapFilesLocais.length > 0) && (
        <section className="dark-panel dark-migration-panel">
          <div>
            <h2>Arquivos salvos apenas neste notebook</h2>
            <p>
              Migre as curvas e os mapas antigos para que também apareçam no celular e em outros computadores.
            </p>
          </div>
          <button className="botao-primario" onClick={migrarArquivosLocais} disabled={migrando}>
            <Upload size={17} /> {migrando ? 'Migrando...' : 'Migrar para a nuvem'}
          </button>
        </section>
      )}


      <section className="dark-panel">
        <div className="dark-section-head">
          <div>
            <h2><Camera size={20} /> Fotos do circuito</h2>
            <p>Organize as imagens por site, POP, CEO, torre ou outro local.</p>
          </div>

          {!pastaFotoAtiva ? (
            <button className="botao-primario" onClick={criarPastaFotos}>
              <FolderPlus size={17} /> Nova pasta
            </button>
          ) : (
            <button
              className="botao-primario"
              onClick={() => inputFoto.current?.click()}
              disabled={uploadingFoto || pastaFotoAtiva.id === '__sem_pasta__'}
            >
              <Upload size={17} /> {uploadingFoto ? 'Enviando...' : 'Adicionar foto'}
            </button>
          )}

          <input ref={inputFoto} type="file" accept="image/*" hidden onChange={enviarFoto} />
        </div>

        {!pastaFotoAtiva ? (
          <>
            {pastasFotos.length === 0 && fotosSemPasta.length === 0 ? (
              <div className="dark-empty compact">
                <Folder size={38} />
                <h3>Nenhuma pasta de fotos</h3>
                <p>Crie uma pasta para cada local do circuito.</p>
              </div>
            ) : (
              <div className="dark-photo-folders">
                {pastasFotos.map(pasta => {
                  const quantidade = fotos.filter(foto => foto.pastaId === pasta.id).length;
                  return (
                    <article key={pasta.id}>
                      <button className="dark-photo-folder-open" onClick={() => setPastaFotoAtiva(pasta)}>
                        <Folder size={30} />
                        <span>
                          <strong>{pasta.nome}</strong>
                          <small>{quantidade} foto(s)</small>
                        </span>
                      </button>
                      <div className="dark-photo-folder-actions">
                        <button onClick={() => renomearPastaFotos(pasta)} title="Renomear pasta">
                          <Pencil size={16} />
                        </button>
                        <button className="danger" onClick={() => excluirPastaFotos(pasta)} title="Excluir pasta">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })}

                {fotosSemPasta.length > 0 && (
                  <article>
                    <button
                      className="dark-photo-folder-open"
                      onClick={() => setPastaFotoAtiva({ id: '__sem_pasta__', nome: 'Fotos antigas sem pasta' })}
                    >
                      <Folder size={30} />
                      <span>
                        <strong>Fotos antigas sem pasta</strong>
                        <small>{fotosSemPasta.length} foto(s)</small>
                      </span>
                    </button>
                  </article>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="dark-photo-folder-toolbar">
              <button className="botao-cancelar" onClick={() => setPastaFotoAtiva(null)}>
                <ChevronLeft size={17} /> Voltar às pastas
              </button>
              <div>
                <Folder size={20} />
                <strong>{pastaFotoAtiva.nome}</strong>
              </div>
            </div>

            {fotosDaPastaAtiva.length === 0 ? (
              <div className="dark-empty compact">
                <ImageIcon size={38} />
                <h3>Nenhuma foto nesta pasta</h3>
              </div>
            ) : (
              <div className="dark-photo-grid">
                {fotosDaPastaAtiva.map(foto => (
                  <article key={foto.id}>
                    <a href={foto.url} target="_blank" rel="noopener noreferrer">
                      <img src={foto.url} alt={foto.nome || 'Foto do circuito'} />
                    </a>
                    <div>
                      <span title={foto.nome}>{foto.nome}</span>
                      <button className="danger" onClick={() => excluirFoto(foto)} title="Excluir foto">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
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

        {todasCurvas.length === 0 ? (
          <div className="dark-empty compact">
            <Activity size={38} />
            <h3>Nenhuma curva OTDR</h3>
          </div>
        ) : (
          <div className="otdr-simple-list">
            {todasCurvas.map(curva => (
              <article key={curva.id}>
                <div>
                  <strong>{curva.fibra} · {curva.comprimentoOnda} nm</strong>
                  <span>{curva.sentido}</span>
                  <small>{curva.nome || curva.arquivoNome}</small>
                  {curva.local && <small>Somente neste dispositivo</small>}
                </div>
                <div>
                  <button onClick={() => abrirCurva(curva)} title="Visualizar">
                    <Eye size={17} />
                  </button>
                  <button onClick={() => abrirCurva(curva, true)} title="Baixar">
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