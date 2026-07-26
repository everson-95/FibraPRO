import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cable, MapPin, Plus, Search, Trash2, ArrowRight, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { lerDados, salvarDados, novoId } from '../utils/localData';
import './Backbone.css';
import './DarkFiber.css';

const KEY='fibrapro-darkfiber';
const vazio={cliente:'',rota:'',fibras:'',origem:'',destino:'',latOrigem:'',lngOrigem:'',latDestino:'',lngDestino:'',cabo:'',status:'Em uso',observacao:''};

export default function DarkFiber(){
 const [items,setItems]=useState(()=>lerDados(KEY));
 const [q,setQ]=useState('');
 const [modal,setModal]=useState(false);
 const [form,setForm]=useState(vazio);
 const [openGroups,setOpenGroups]=useState({});
 const filtrados=useMemo(()=>items.filter(i=>JSON.stringify(i).toLowerCase().includes(q.toLowerCase())),[items,q]);
 const grupos=useMemo(()=>{
   const grouped={};
   filtrados.forEach(item=>{const nome=(item.cliente||'Sem cliente').trim();if(!grouped[nome])grouped[nome]=[];grouped[nome].push(item)});
   return Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b,'pt-BR'));
 },[filtrados]);
 function salvar(e){e.preventDefault();if(!form.cliente.trim())return alert('Informe o cliente.');if(!form.rota.trim())return alert('Informe a rota.');const next=[{...form,id:novoId('darkfiber'),criadoEm:new Date().toISOString()},...items];setItems(next);salvarDados(KEY,next);setOpenGroups(v=>({...v,[form.cliente.trim()]:true}));setForm(vazio);setModal(false)}
 function excluir(id){if(!confirm('Excluir este circuito Dark Fiber?'))return;const next=items.filter(i=>i.id!==id);setItems(next);salvarDados(KEY,next)}
 function toggle(nome){setOpenGroups(v=>({...v,[nome]:v[nome]===false?true:false}))}
 return <div className="backbone-page">
  <div className="backbone-cabecalho">
   <div><span className="pagina-identificacao">Infraestrutura óptica</span><h1>Dark Fiber</h1><p>Clientes organizados em pastas, com todas as rotas e circuitos separados.</p></div>
   <button className="botao-nova-rota" onClick={()=>setModal(true)}><Plus size={18}/> Novo circuito</button>
  </div>
  <div className="dark-search"><Search size={18}/><input placeholder="Pesquisar cliente, rota, fibra, origem ou destino..." value={q} onChange={e=>setQ(e.target.value)}/><span>{filtrados.length} circuito(s)</span></div>
  {grupos.length===0?<div className="dark-empty"><Cable size={42}/><h3>Nenhum circuito cadastrado</h3><p>Cadastre a primeira Dark Fiber para começar.</p></div>:<div className="dark-company-list">
   {grupos.map(([cliente,circuitos])=>{const aberto=openGroups[cliente]!==false;return <section className="dark-company" key={cliente}>
    <button className="dark-company-header" onClick={()=>toggle(cliente)}>
      <span className="dark-company-icon"><Folder size={21}/></span>
      <span className="dark-company-title"><strong>{cliente}</strong><small>{circuitos.length} rota(s) cadastrada(s)</small></span>
      {aberto?<ChevronDown size={20}/>:<ChevronRight size={20}/>} 
    </button>
    {aberto&&<div className="backbone-grid dark-company-grid">{circuitos.map(item=><article className="rota-card dark-backbone-card" key={item.id}>
      <div className="rota-card-topo"><div className="rota-icone"><Cable size={23}/></div><span className={`status-rota ${item.status==='Em uso'?'status-operacional':'status-cadastro'}`}>{item.status}</span></div>
      <h2>{item.rota}</h2><p className="nome-completo">{item.origem||'Origem'} ↔ {item.destino||'Destino'}</p>
      <div className="rota-informacoes">
       <div><MapPin size={17}/><span><strong>Origem:</strong> {item.origem||'Não informada'}</span></div>
       <div><MapPin size={17}/><span><strong>Destino:</strong> {item.destino||'Não informado'}</span></div>
       <div><Cable size={17}/><span><strong>Fibras:</strong> {item.fibras||'Não informadas'}</span></div>
       <div><Cable size={17}/><span><strong>Cabo:</strong> {item.cabo||'Não informado'}</span></div>
      </div>
      <div className="dark-card-footer"><Link className="botao-abrir-rota" to={`/darkfiber/${item.id}`}>Abrir circuito <ArrowRight size={18}/></Link><button className="dark-delete" title="Excluir circuito" onClick={()=>excluir(item.id)}><Trash2 size={19}/></button></div>
     </article>)}</div>}
   </section>})}
  </div>}
  {modal&&<div className="modal-backdrop" onMouseDown={()=>setModal(false)}><div className="crud-modal" onMouseDown={e=>e.stopPropagation()}><div className="crud-modal-head"><h2>Novo circuito Dark Fiber</h2><button onClick={()=>setModal(false)}>×</button></div><form className="crud-form" onSubmit={salvar}>
   <label><span>Cliente / pasta *</span><input value={form.cliente} onChange={e=>setForm({...form,cliente:e.target.value})} placeholder="Ex.: TIM S.A."/></label><label><span>Rota *</span><input value={form.rota} onChange={e=>setForm({...form,rota:e.target.value})} placeholder="Ex.: MCH ↔ PTE"/></label>
   <label><span>Fibras utilizadas</span><input value={form.fibras} onChange={e=>setForm({...form,fibras:e.target.value})} placeholder="Ex.: FO 11 e 12"/></label><label><span>Cabo</span><input value={form.cabo} onChange={e=>setForm({...form,cabo:e.target.value})}/></label>
   <label><span>Origem</span><input value={form.origem} onChange={e=>setForm({...form,origem:e.target.value})}/></label><label><span>Destino</span><input value={form.destino} onChange={e=>setForm({...form,destino:e.target.value})}/></label>
   <label><span>Latitude da origem</span><input value={form.latOrigem} onChange={e=>setForm({...form,latOrigem:e.target.value})}/></label><label><span>Longitude da origem</span><input value={form.lngOrigem} onChange={e=>setForm({...form,lngOrigem:e.target.value})}/></label>
   <label><span>Latitude do destino</span><input value={form.latDestino} onChange={e=>setForm({...form,latDestino:e.target.value})}/></label><label><span>Longitude do destino</span><input value={form.lngDestino} onChange={e=>setForm({...form,lngDestino:e.target.value})}/></label>
   <label><span>Status</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Em uso</option><option>Reservada</option><option>Manutenção</option><option>Encerrada</option></select></label>
   <label className="full"><span>Observações</span><textarea value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})}/></label><div className="crud-buttons full"><button type="button" className="botao-secundario" onClick={()=>setModal(false)}>Cancelar</button><button className="botao-primario">Salvar circuito</button></div>
  </form></div></div>}
 </div>
}
