import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileArchive,
  FolderOpen,
  MapPin,
  Trash2,
  Upload,
  Pencil,
  Save,
  X,
  Cable
} from 'lucide-react';
import useFirestoreDocument from '../hooks/useFirestoreDocument';
import { criarCaminhoArquivo, deleteFile, uploadFile } from '../services/storage';
import { excluirAnexo, observarAnexos, salvarAnexo } from '../services/anexos';
import { updateRecord } from '../services/firestoreCrud';
import './FTTH.css';
import { useAuth } from '../context/AuthContext';

function formatarTamanho(bytes = 0) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return 'Tamanho não informado';
  const valor = Number(bytes);
  if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(1)} KB`;
  return `${(valor / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FTTHDetalhes() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { item: rede, loading } = useFirestoreDocument('ftthRedes', id);
  const [arquivos, setArquivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvandoDetalhes, setSalvandoDetalhes] = useState(false);
  const [detalhes, setDetalhes] = useState({});
  const inputArquivo = useRef(null);

  useEffect(() => {
    setDetalhes(rede || {});
  }, [rede]);

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

  async function baixarArquivo(arquivo) {
    if (!arquivo.url) {
      alert('O endereço deste arquivo não está disponível.');
      return;
    }

    try {
      const resposta = await fetch(arquivo.url);
      if (!resposta.ok) throw new Error(`Falha no download: ${resposta.status}`);
      const blob = await resposta.blob();
      const urlTemporaria = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlTemporaria;
      link.download = arquivo.nome || 'rede-ftth.kmz';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(urlTemporaria);
    } catch (erro) {
      console.error('Erro ao baixar FTTH:', erro);
      alert('Não foi possível baixar o arquivo. Verifique a internet e tente novamente.');
    }
  }

  async function salvarDetalhes(evento) {
    evento.preventDefault();
    if (!isAdmin) {
      window.dispatchEvent(new Event('open-admin-login'));
      return;
    }

    setSalvandoDetalhes(true);
    try {
      await updateRecord('ftthRedes', id, {
        cabo: String(detalhes.cabo || '').trim(),
        tipoCabo: String(detalhes.tipoCabo || '').trim(),
        quantidadeFibras: String(detalhes.quantidadeFibras || '').trim(),
        origem: String(detalhes.origem || '').trim(),
        destino: String(detalhes.destino || '').trim(),
        distancia: String(detalhes.distancia || '').trim(),
        observacao: String(detalhes.observacao || '').trim()
      });
      setEditando(false);
    } catch (erro) {
      console.error('Erro ao salvar detalhes FTTH:', erro);
      alert('Não foi possível salvar os detalhes da rede.');
    } finally {
      setSalvandoDetalhes(false);
    }
  }

  async function removerArquivo(arquivo) {
    if (!isAdmin) { window.dispatchEvent(new Event('open-admin-login')); return; }
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

      <section className="ftth-panel ftth-details-panel">
        <div className="ftth-section-head">
          <div>
            <h2><Cable size={20} /> Detalhes da rede</h2>
            <p>Informações do cabo e do trecho FTTH.</p>
          </div>
          {isAdmin && !editando && (
            <button type="button" className="botao-primario" onClick={() => setEditando(true)}>
              <Pencil size={17} /> Editar detalhes
            </button>
          )}
        </div>

        {editando ? (
          <form className="ftth-details-form" onSubmit={salvarDetalhes}>
            <label><span>Identificação do cabo</span><input value={detalhes.cabo || ''} onChange={e => setDetalhes({...detalhes, cabo: e.target.value})} placeholder="Ex.: Cabo principal" /></label>
            <label><span>Tipo do cabo</span><input value={detalhes.tipoCabo || ''} onChange={e => setDetalhes({...detalhes, tipoCabo: e.target.value})} placeholder="Ex.: AS80 12FO" /></label>
            <label><span>Quantidade de fibras</span><input value={detalhes.quantidadeFibras || ''} onChange={e => setDetalhes({...detalhes, quantidadeFibras: e.target.value})} placeholder="Ex.: 12" /></label>
            <label><span>Distância</span><input value={detalhes.distancia || ''} onChange={e => setDetalhes({...detalhes, distancia: e.target.value})} placeholder="Ex.: 8,5 km" /></label>
            <label><span>Origem</span><input value={detalhes.origem || ''} onChange={e => setDetalhes({...detalhes, origem: e.target.value})} placeholder="Ex.: POP Malacacheta" /></label>
            <label><span>Destino</span><input value={detalhes.destino || ''} onChange={e => setDetalhes({...detalhes, destino: e.target.value})} placeholder="Ex.: Bairro Centro" /></label>
            <label className="full"><span>Observações</span><textarea rows="3" value={detalhes.observacao || ''} onChange={e => setDetalhes({...detalhes, observacao: e.target.value})} /></label>
            <div className="ftth-details-buttons full">
              <button type="button" className="botao-secundario" onClick={() => { setDetalhes(rede || {}); setEditando(false); }}><X size={17} /> Cancelar</button>
              <button type="submit" className="botao-primario" disabled={salvandoDetalhes}><Save size={17} /> {salvandoDetalhes ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        ) : (
          <dl className="ftth-details-grid">
            <div><dt>Cabo</dt><dd>{rede.cabo || 'Não informado'}</dd></div>
            <div><dt>Tipo do cabo</dt><dd>{rede.tipoCabo || 'Não informado'}</dd></div>
            <div><dt>Quantidade de fibras</dt><dd>{rede.quantidadeFibras || 'Não informada'}</dd></div>
            <div><dt>Distância</dt><dd>{rede.distancia || 'Não informada'}</dd></div>
            <div><dt>Origem</dt><dd>{rede.origem || 'Não informada'}</dd></div>
            <div><dt>Destino</dt><dd>{rede.destino || 'Não informado'}</dd></div>
            <div className="full"><dt>Observações</dt><dd>{rede.observacao || 'Nenhuma observação'}</dd></div>
          </dl>
        )}
      </section>

      <section className="ftth-panel">
        <div className="ftth-section-head">
          <div>
            <h2><FileArchive size={20} /> Arquivos da rede</h2>
            <p>Os técnicos podem baixar os arquivos KMZ/KML pelo celular.</p>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="botao-primario"
              disabled={enviando}
              onClick={() => inputArquivo.current?.click()}
            >
              <Upload size={17} /> {enviando ? 'Enviando...' : 'Adicionar KMZ/KML'}
            </button>
          )}

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
                  {isAdmin && (
                    <button
                      type="button"
                      className="danger"
                      title="Excluir arquivo"
                      onClick={() => removerArquivo(arquivo)}
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
