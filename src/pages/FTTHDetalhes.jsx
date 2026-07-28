import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileArchive,
  FolderOpen,
  MapPin,
  Trash2,
  Upload
} from 'lucide-react';
import useFirestoreDocument from '../hooks/useFirestoreDocument';
import { criarCaminhoArquivo, deleteFile, uploadFile } from '../services/storage';
import { excluirAnexo, observarAnexos, salvarAnexo } from '../services/anexos';
import './FTTH.css';

function formatarTamanho(bytes = 0) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return 'Tamanho não informado';
  const valor = Number(bytes);
  if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(1)} KB`;
  return `${(valor / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FTTHDetalhes() {
  const { id } = useParams();
  const { item: rede, loading } = useFirestoreDocument('ftthRedes', id);
  const [arquivos, setArquivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const inputArquivo = useRef(null);

  useEffect(() => {
    if (!id) return undefined;

    return observarAnexos(
      'ftthRedes',
      id,
      'KMZ',
      setArquivos,
      erro => console.error('Erro ao carregar arquivos FTTH:', erro)
    );
  }, [id]);

  async function enviarArquivo(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;

    if (!/\.(kmz|kml)$/i.test(arquivo.name)) {
      alert('Selecione um arquivo KMZ ou KML.');
      return;
    }

    setEnviando(true);

    try {
      const caminho = criarCaminhoArquivo('ftth', id, 'kmz', arquivo.name);
      const upload = await uploadFile(caminho, arquivo);

      await salvarAnexo({
        parentType: 'ftthRedes',
        parentId: id,
        categoria: 'KMZ',
        nome: arquivo.name,
        tipo: arquivo.type || '',
        tamanho: arquivo.size,
        url: upload.url,
        storagePath: upload.path
      });
    } catch (erro) {
      console.error('Erro ao enviar KMZ/KML:', erro);
      alert(erro.message || 'Não foi possível enviar o arquivo.');
    } finally {
      setEnviando(false);
    }
  }

  function baixarArquivo(arquivo) {
    if (!arquivo.url) {
      alert('O endereço deste arquivo não está disponível.');
      return;
    }

    const link = document.createElement('a');
    link.href = arquivo.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = arquivo.nome || 'rede-ftth.kmz';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function removerArquivo(arquivo) {
    if (!confirm(`Excluir o arquivo ${arquivo.nome}?`)) return;

    try {
      await deleteFile(arquivo.storagePath);
      await excluirAnexo(arquivo.id);
    } catch (erro) {
      console.error('Erro ao excluir arquivo FTTH:', erro);
      alert('Não foi possível excluir o arquivo.');
    }
  }

  if (loading) {
    return <div className="ftth-empty">Carregando pasta da rede...</div>;
  }

  if (!rede) {
    return (
      <div className="ftth-empty">
        <h2>Rede FTTH não encontrada</h2>
        <Link to="/ftth">Voltar para FTTH</Link>
      </div>
    );
  }

  return (
    <div className="ftth-page">
      <Link className="voltar-link" to="/ftth">
        <ArrowLeft size={17} /> Voltar para FTTH
      </Link>

      <header className="ftth-cabecalho ftth-folder-header">
        <div>
          <span>PASTA DA REDE FTTH</span>
          <h1><FolderOpen size={34} /> {rede.nome}</h1>
          <p>
            <MapPin size={15} /> {rede.cidade || 'Cidade não informada'}
          </p>
        </div>
        <span className="ftth-status">{rede.status || 'Operacional'}</span>
      </header>

      {rede.observacao && (
        <section className="ftth-panel ftth-note-panel">
          <h2>Observações</h2>
          <p>{rede.observacao}</p>
        </section>
      )}

      <section className="ftth-panel">
        <div className="ftth-section-head">
          <div>
            <h2><FileArchive size={20} /> Arquivos da rede</h2>
            <p>Os técnicos podem baixar os arquivos KMZ/KML pelo celular.</p>
          </div>

          <button
            type="button"
            className="botao-primario"
            disabled={enviando}
            onClick={() => inputArquivo.current?.click()}
          >
            <Upload size={17} /> {enviando ? 'Enviando...' : 'Adicionar KMZ/KML'}
          </button>

          <input
            ref={inputArquivo}
            type="file"
            hidden
            accept=".kmz,.kml,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml"
            onChange={enviarArquivo}
          />
        </div>

        {arquivos.length === 0 ? (
          <div className="ftth-empty compact">
            <FileArchive size={40} />
            <h3>Nenhum arquivo nesta pasta</h3>
            <p>Adicione o KMZ ou KML para disponibilizar à equipe.</p>
          </div>
        ) : (
          <div className="ftth-files ftth-download-list">
            {arquivos.map(arquivo => (
              <article key={arquivo.id}>
                <div>
                  <div className="ftth-file-icon">
                    <FileArchive size={22} />
                  </div>
                  <span>
                    <strong>{arquivo.nome}</strong>
                    <small>{formatarTamanho(arquivo.tamanho)}</small>
                  </span>
                </div>

                <div className="ftth-file-actions">
                  <button
                    type="button"
                    className="ftth-download-button"
                    onClick={() => baixarArquivo(arquivo)}
                  >
                    <Download size={17} /> Baixar
                  </button>
                  <button
                    type="button"
                    className="danger"
                    title="Excluir arquivo"
                    onClick={() => removerArquivo(arquivo)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
