import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { excluirPOP, listarPOPs, salvarPOP } from '../services/pops';
import { atualizarPOP } from '../services/pops';
import { useAuth } from '../context/AuthContext';
import { salvarAnexo } from '../services/anexos';
import './POPs.css';

const vazio = {
  nome: '', sigla: '', cidade: '', endereco: '', latitude: '', longitude: '', maps: '',
  status: 'Operacional', responsavel: '', telefone: '', observacao: ''
};

export default function POPs() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    try { setItems(await listarPOPs()); }
    catch (erro) { console.error(erro); alert('Não foi possível carregar os POPs.'); }
    finally { setCarregando(false); }
  }

  useEffect(() => { carregar(); }, []);

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    if (!termo) return items;
    return items.filter(pop => `${pop.nome} ${pop.sigla} ${pop.cidade} ${pop.endereco} ${pop.status}`.toLowerCase().includes(termo));
  }, [items, q]);

  function pedirAdmin() { window.dispatchEvent(new Event('open-admin-login')); }
  function novo() { if (!isAdmin) return pedirAdmin(); setForm(vazio); setModal(true); }
  function editar(pop) { if (!isAdmin) return pedirAdmin(); setForm({ ...vazio, ...pop }); setModal(true); }

  async function salvar(evento) {
    evento.preventDefault();
    if (!isAdmin) return pedirAdmin();
    if (!form.nome.trim()) return alert('Informe o nome do POP.');
    setSalvando(true);
    try {
      if (form.id) await atualizarPOP(form.id, form);
      else {
        const referencia = await salvarPOP(form);
        const pastasPadrao = ['Fachada','Rack','DIO','Switch','OLT','CEO','Torre','Energia','Geral'];
        await Promise.all(pastasPadrao.map(nome => salvarAnexo({ parentType:'pop', parentId:referencia.id, categoria:'FOTO_PASTA', nome })));
      }
      setModal(false); setForm(vazio); await carregar();
    } catch (erro) { console.error(erro); alert('Não foi possível salvar o POP.'); }
    finally { setSalvando(false); }
  }

  async function remover(pop) {
    if (!isAdmin) return pedirAdmin();
    if (!confirm(`Excluir o POP "${pop.nome}"? Os anexos vinculados não serão apagados automaticamente.`)) return;
    try { await excluirPOP(pop.id); await carregar(); }
    catch (erro) { console.error(erro); alert('Não foi possível excluir o POP.'); }
  }

  return <div className="pops-page">
    <header className="pops-header">
      <div><span className="pagina-identificacao">INFRAESTRUTURA FÍSICA</span><h1>POPs</h1><p>Documente localização, fotos, DIOs, switches, equipamentos e energia de cada ponto de presença.</p></div>
      <button className={`botao-primario ${!isAdmin ? 'admin-locked' : ''}`} onClick={novo}><Plus size={18}/> Novo POP{!isAdmin ? ' 🔒' : ''}</button>
    </header>

    <div className="pops-toolbar"><Search size={18}/><input placeholder="Pesquisar POP, sigla, cidade ou endereço..." value={q} onChange={e => setQ(e.target.value)}/><span>{filtrados.length} POP(s)</span></div>

    {carregando ? <div className="pops-empty">Carregando POPs...</div> : filtrados.length === 0 ? <div className="pops-empty"><Building2 size={42}/><h3>Nenhum POP cadastrado</h3><p>Cadastre o primeiro ponto de presença.</p></div> : <div className="pops-grid">
      {filtrados.map(pop => <article className="pop-card" key={pop.id}>
        <div className="pop-card-top"><div className="pop-icon"><Building2 size={24}/></div><span className={`pop-status ${String(pop.status || '').toLowerCase().replace(/\s+/g,'-')}`}>{pop.status || 'Operacional'}</span></div>
        <h2>{pop.nome}</h2><p className="pop-subtitle">{pop.sigla ? `${pop.sigla} · ` : ''}{pop.cidade || 'Cidade não informada'}</p>
        <div className="pop-info"><div><MapPin size={16}/><span>{pop.endereco || 'Endereço não informado'}</span></div>{pop.latitude && pop.longitude && <div><MapPin size={16}/><span>{pop.latitude}, {pop.longitude}</span></div>}</div>
        <div className="pop-actions"><Link to={`/pops/${pop.id}`}>Abrir POP</Link>{pop.maps && <a href={pop.maps} target="_blank" rel="noreferrer"><MapPin size={16}/> Mapa</a>}<button onClick={() => editar(pop)} title="Editar"><Pencil size={16}/></button>{isAdmin && <button className="danger" onClick={() => remover(pop)} title="Excluir"><Trash2 size={16}/></button>}</div>
      </article>)}
    </div>}

    {modal && <div className="modal-backdrop" onMouseDown={() => setModal(false)}><div className="crud-modal pop-modal" onMouseDown={e => e.stopPropagation()}>
      <div className="crud-modal-head"><div><h2>{form.id ? 'Editar POP' : 'Novo POP'}</h2><p>Cadastre os dados principais do ponto de presença.</p></div><button onClick={() => setModal(false)}>×</button></div>
      <form className="crud-form" onSubmit={salvar}>
        {[['nome','Nome do POP *'],['sigla','Sigla'],['cidade','Cidade'],['endereco','Endereço'],['latitude','Latitude'],['longitude','Longitude'],['maps','Link Google Maps'],['responsavel','Responsável'],['telefone','Telefone']].map(([n,l]) => <label key={n}><span>{l}</span><input value={form[n] || ''} onChange={e => setForm({...form,[n]:e.target.value})}/></label>)}
        <label><span>Status</span><select value={form.status || 'Operacional'} onChange={e => setForm({...form,status:e.target.value})}><option>Operacional</option><option>Manutenção</option><option>Atenção</option><option>Inativo</option></select></label>
        <label className="full"><span>Observações</span><textarea rows="4" value={form.observacao || ''} onChange={e => setForm({...form,observacao:e.target.value})}/></label>
        <div className="crud-buttons full"><button type="button" className="botao-secundario" onClick={() => setModal(false)}>Cancelar</button><button className="botao-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar POP'}</button></div>
      </form>
    </div></div>}
  </div>;
}
