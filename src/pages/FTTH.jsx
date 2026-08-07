import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileArchive,
  FolderOpen,
  MapPin,
  Plus,
  Search,
  Trash2,
  Upload,
  Info
} from 'lucide-react';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
import { createRecord, deleteRecord } from '../services/firestoreCrud';
import { criarCaminhoArquivo, uploadFile } from '../services/storage';
import { salvarAnexo } from '../services/anexos';
import { useAuth } from '../context/AuthContext';
import './FTTH.css';

const formularioInicial = {
  nome: '',
  cidade: '',
  observacao: '',
  status: 'Operacional',
  cabo: '',
  tipoCabo: '',
  quantidadeFibras: '',
  origem: '',
  destino: '',
  distancia: ''
};

export default function FTTH() {
  const { isAdmin } = useAuth();
  const {
    items: redes,
    loading,
    error
  } = useFirestoreCollection('ftthRedes', { orderBy: 'nome' });

  const [modal, setModal] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [arquivo, setArquivo] = useState(null);
  const [pesquisa, setPesquisa] = useState('');
  const [salvando, setSalvando] = useState(false);

  const redesFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return redes;

    return redes.filter(rede =>
      [rede.nome, rede.cidade, rede.observacao, rede.status]
        .filter(Boolean)
        .some(valor => String(valor).toLowerCase().includes(termo))
    );
  }, [redes, pesquisa]);

  function fecharModal() {
    if (salvando) return;
    setModal(false);
    setFormulario(formularioInicial);
    setArquivo(null);
  }

  async function salvarRede(evento) {
    evento.preventDefault();

    if (!formulario.nome.trim()) {
      alert('Informe o nome da rede FTTH.');
      return;
    }

    if (arquivo && !/\.(kmz|kml)$/i.test(arquivo.name)) {
      alert('Selecione um arquivo KMZ ou KML.');
      return;
    }

    setSalvando(true);

    try {
      const referencia = await createRecord('ftthRedes', {
        nome: formulario.nome.trim(),
        cidade: formulario.cidade.trim(),
        observacao: formulario.observacao.trim(),
        status: formulario.status,
        cabo: formulario.cabo.trim(),
        tipoCabo: formulario.tipoCabo.trim(),
        quantidadeFibras: formulario.quantidadeFibras.trim(),
        origem: formulario.origem.trim(),
        destino: formulario.destino.trim(),
        distancia: formulario.distancia.trim()
      });

      if (arquivo) {
        const caminho = criarCaminhoArquivo(
          'ftth',
          referencia.id,
          'kmz',
          arquivo.name
        );

        const upload = await uploadFile(caminho, arquivo);

        await salvarAnexo({
          parentType: 'ftthRedes',
          parentId: referencia.id,
          categoria: 'KMZ',
          nome: arquivo.name,
          tipo: arquivo.type || '',
          tamanho: arquivo.size,
          url: upload.url,
          storagePath: upload.path
        });
      }

      setModal(false);
      setFormulario(formularioInicial);
      setArquivo(null);
    } catch (erro) {
      console.error('Erro ao cadastrar rede FTTH:', erro);
      alert('Não foi possível cadastrar a rede FTTH.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirRede(id) {
    if (!isAdmin) { window.dispatchEvent(new Event('open-admin-login')); return; }
    if (!confirm('Excluir esta pasta de rede FTTH? Os arquivos devem ser removidos antes na tela da rede.')) {
      return;
    }

    try {
      await deleteRecord('ftthRedes', id);
    } catch (erro) {
      console.error('Erro ao excluir rede FTTH:', erro);
      alert('Não foi possível excluir a rede FTTH.');
    }
  }

  return (
    <div className="ftth-page">
      <header className="ftth-cabecalho">
        <div>
          <span>DOCUMENTAÇÃO DE REDE</span>
          <h1>Redes FTTH</h1>
          <p>Pastas das redes FTTH com arquivos KMZ/KML disponíveis para a equipe técnica.</p>
        </div>

        {isAdmin && (
          <button type="button" onClick={() => setModal(true)}>
            <Plus size={17} /> Nova rede FTTH
          </button>
        )}
      </header>

      <div className="ftth-toolbar">
        <Search size={18} />
        <input
          type="search"
          placeholder="Pesquisar rede ou cidade..."
          value={pesquisa}
          onChange={evento => setPesquisa(evento.target.value)}
        />
        <span>{redesFiltradas.length} pasta(s)</span>
      </div>

      {loading ? (
        <div className="ftth-empty">Carregando redes da nuvem...</div>
      ) : error ? (
        <div className="ftth-empty">Não foi possível carregar as redes FTTH.</div>
      ) : redesFiltradas.length === 0 ? (
        <div className="ftth-empty">
          <FolderOpen size={42} />
          <h3>Nenhuma rede FTTH cadastrada</h3>
          <p>Crie uma pasta para disponibilizar o KMZ aos técnicos.</p>
        </div>
      ) : (
        <div className="ftth-grid">
          {redesFiltradas.map(rede => (
            <article className="ftth-card ftth-folder-card" key={rede.id}>
              <div className="ftth-card-top">
                <div className="ftth-folder-icon">
                  <FolderOpen size={29} />
                </div>
                <span>{rede.status || 'Operacional'}</span>
              </div>

              <h2>{rede.nome}</h2>

              <div className="ftth-dados">
                <span>
                  <MapPin size={16} />
                  {rede.cidade || 'Cidade não informada'}
                </span>
                <span>
                  <FileArchive size={16} />
                  Pasta de arquivos KMZ/KML
                </span>
              </div>

              {rede.observacao && <p className="ftth-card-observacao">{rede.observacao}</p>}

              <div className="ftth-actions">
                <Link className="abrir-ftth" to={`/ftth/${rede.id}`}>
                  <ArrowRight size={16} /> Abrir pasta
                </Link>
                <Link
                  className="detalhes-ftth"
                  to={`/ftth/${rede.id}`}
                  title="Abrir detalhes da rede"
                  aria-label="Abrir detalhes da rede"
                >
                  <Info size={17} />
                </Link>
                {isAdmin && (
                  <button
                    type="button"
                    className="excluir-ftth"
                    title="Excluir pasta"
                    onClick={() => excluirRede(rede.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onMouseDown={fecharModal}>
          <div className="crud-modal" onMouseDown={evento => evento.stopPropagation()}>
            <div className="crud-modal-head">
              <div>
                <h2>Nova rede FTTH</h2>
                <p>Cadastre a pasta e, se desejar, já envie o KMZ.</p>
              </div>
              <button type="button" onClick={fecharModal}>×</button>
            </div>

            <form className="crud-form" onSubmit={salvarRede}>
              <label>
                <span>Nome da rede *</span>
                <input
                  value={formulario.nome}
                  onChange={evento => setFormulario({ ...formulario, nome: evento.target.value })}
                  placeholder="Ex.: FTTH Malacacheta"
                />
              </label>

              <label>
                <span>Cidade</span>
                <input
                  value={formulario.cidade}
                  onChange={evento => setFormulario({ ...formulario, cidade: evento.target.value })}
                  placeholder="Ex.: Malacacheta"
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={formulario.status}
                  onChange={evento => setFormulario({ ...formulario, status: evento.target.value })}
                >
                  <option>Operacional</option>
                  <option>Implantação</option>
                  <option>Manutenção</option>
                  <option>Desativada</option>
                </select>
              </label>

              <label>
                <span>Identificação do cabo</span>
                <input
                  value={formulario.cabo}
                  onChange={evento => setFormulario({ ...formulario, cabo: evento.target.value })}
                  placeholder="Ex.: Cabo principal AS80"
                />
              </label>

              <label>
                <span>Tipo do cabo</span>
                <input
                  value={formulario.tipoCabo}
                  onChange={evento => setFormulario({ ...formulario, tipoCabo: evento.target.value })}
                  placeholder="Ex.: AS80 12FO"
                />
              </label>

              <label>
                <span>Quantidade de fibras</span>
                <input
                  value={formulario.quantidadeFibras}
                  onChange={evento => setFormulario({ ...formulario, quantidadeFibras: evento.target.value })}
                  placeholder="Ex.: 12"
                />
              </label>

              <label>
                <span>Distância</span>
                <input
                  value={formulario.distancia}
                  onChange={evento => setFormulario({ ...formulario, distancia: evento.target.value })}
                  placeholder="Ex.: 8,5 km"
                />
              </label>

              <label>
                <span>Origem</span>
                <input
                  value={formulario.origem}
                  onChange={evento => setFormulario({ ...formulario, origem: evento.target.value })}
                  placeholder="Ex.: POP Malacacheta"
                />
              </label>

              <label>
                <span>Destino</span>
                <input
                  value={formulario.destino}
                  onChange={evento => setFormulario({ ...formulario, destino: evento.target.value })}
                  placeholder="Ex.: Bairro Centro"
                />
              </label>

              <label className="full">
                <span>Observação</span>
                <textarea
                  rows="3"
                  value={formulario.observacao}
                  onChange={evento => setFormulario({ ...formulario, observacao: evento.target.value })}
                  placeholder="Informações importantes sobre esta rede."
                />
              </label>

              <label className="full ftth-upload-field">
                <span>Arquivo KMZ/KML inicial (opcional)</span>
                <input
                  type="file"
                  accept=".kmz,.kml,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml"
                  onChange={evento => setArquivo(evento.target.files?.[0] || null)}
                />
                <small>
                  <Upload size={15} />
                  {arquivo ? arquivo.name : 'Você também poderá enviar o arquivo depois.'}
                </small>
              </label>

              <div className="crud-buttons full">
                <button type="button" className="botao-secundario" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="botao-primario" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Criar pasta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
