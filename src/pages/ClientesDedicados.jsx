import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, MapPin, Plus, Search, Trash2 } from 'lucide-react';
import { lerDados, novoId, salvarDados } from '../utils/localData';
import './Backbone.css';
import './ClientesDedicados.css';

const KEY='fibrapro-clientes';
const vazio={nome:'',rota:'',origem:'',destino:'',velocidade:'',fibra:'',dio:'',portaSwitch:'',vlan:'',ip:'',sfp:'',status:'Ativo',observacao:'',latitude:'',longitude:''};

export default function ClientesDedicados(){
 const [items,setItems]=useState(()=>lerDados(KEY));
 const [q,setQ]=useState('');
 const [modal,setModal]=useState(false);
 const [form,setForm]=useState(vazio);
 const filtrados=useMemo(()=>items.filter(i=>JSON.stringify(i).toLowerCase().includes(q.toLowerCase())),[items,q]);
 function salvar(e){e.preventDefault();if(!form.nome.trim())return alert('Informe o cliente.');const next=[{...form,id:novoId('cliente-dedicado'),criadoEm:new Date().toISOString()},...items];setItems(next);salvarDados(KEY,next);setForm(vazio);setModal(false)}
 function excluir(id){if(!confirm('Excluir este cliente dedicado?'))return;const next=items.filter(i=>i.id!==id);setItems(next);salvarDados(KEY,next)}
 return <div className="backbone-page">
  <div className="backbone-cabecalho"><div><span className="pagina-identificacao">Circuitos corporativos</span><h1>Clientes Dedicados</h1><p>Cada circuito possui mapa, KMZ/KML, dados técnicos e documentação.</p></div><button className="botao-nova-rota" onClick={()=>setModal(true)}><Plus size={18}/> Novo cliente</button></div>
  <div className="dark-search"><Search size={18}/><input placeholder="Pesquisar cliente, rota, VLAN, IP ou fibra..." value={q} onChange={e=>setQ(e.target.value)}/><span>{filtrados.length} resultado(s)</span></div>
  {filtrados.length===0?<div className="dark-empty"><Building2 size={42}/><h3>Nenhum cliente dedicado</h3><p>Cadastre o primeiro circuito corporativo.</p></div>:<div className="backbone-grid">
   {filtrados.map(item=><article className="rota-card cliente-card" key={item.id}>
    <div className="rota-card-topo"><div className="rota-icone"><Building2 size={23}/></div><span className={`status-rota ${item.status==='Ativo'?'status-operacional':'status-cadastro'}`}>{item.status}</span></div>
    <h2>{item.nome}</h2><p className="nome-completo">{item.rota||`${item.origem||'Origem'} ↔ ${item.destino||'Destino'}`}</p>
    <div className="rota-informacoes"><div><MapPin size={17}/><span><strong>Origem:</strong> {item.origem||'Não informada'}</span></div><div><MapPin size={17}/><span><strong>Destino:</strong> {item.destino||'Não informado'}</span></div><div><Building2 size={17}/><span><strong>VLAN:</strong> {item.vlan||'—'}</span></div><div><Building2 size={17}/><span><strong>Velocidade:</strong> {item.velocidade||'—'}</span></div></div>
    <div className="dark-card-footer"><Link className="botao-abrir-rota" to={`/clientes-dedicados/${item.id}`}>Abrir circuito <ArrowRight size={18}/></Link><button className="dark-delete" onClick={()=>excluir(item.id)} title="Excluir"><Trash2 size={19}/></button></div>
   </article>)}
  </div>}
  {modal&&<div className="modal-backdrop" onMouseDown={()=>setModal(false)}><div className="crud-modal" onMouseDown={e=>e.stopPropagation()}><div className="crud-modal-head"><h2>Novo cliente dedicado</h2><button onClick={()=>setModal(false)}>×</button></div><form className="crud-form" onSubmit={salvar}>
    <label><span>Cliente *</span><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/></label><label><span>Rota</span><input value={form.rota} onChange={e=>setForm({...form,rota:e.target.value})}/></label>
    <label><span>Origem</span><input value={form.origem} onChange={e=>setForm({...form,origem:e.target.value})}/></label><label><span>Destino</span><input value={form.destino} onChange={e=>setForm({...form,destino:e.target.value})}/></label>
    <label><span>Velocidade</span><input value={form.velocidade} onChange={e=>setForm({...form,velocidade:e.target.value})}/></label><label><span>Fibra / FO</span><input value={form.fibra} onChange={e=>setForm({...form,fibra:e.target.value})}/></label>
    <label><span>Porta DIO</span><input value={form.dio} onChange={e=>setForm({...form,dio:e.target.value})}/></label><label><span>Porta do switch</span><input value={form.portaSwitch} onChange={e=>setForm({...form,portaSwitch:e.target.value})}/></label>
    <label><span>VLAN</span><input value={form.vlan} onChange={e=>setForm({...form,vlan:e.target.value})}/></label><label><span>IP</span><input value={form.ip} onChange={e=>setForm({...form,ip:e.target.value})}/></label>
    <label><span>SFP</span><input value={form.sfp} onChange={e=>setForm({...form,sfp:e.target.value})}/></label><label><span>Status</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Ativo</option><option>Implantação</option><option>Manutenção</option><option>Inativo</option></select></label>
    <label><span>Latitude central</span><input value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})}/></label><label><span>Longitude central</span><input value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})}/></label>
    <label className="full"><span>Observações</span><textarea value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})}/></label><div className="crud-buttons full"><button type="button" className="botao-secundario" onClick={()=>setModal(false)}>Cancelar</button><button className="botao-primario">Salvar cliente</button></div>
  </form></div></div>}
 </div>
}
