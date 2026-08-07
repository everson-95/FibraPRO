import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Network, MapPin, Cable, ArrowRight, Pencil, Plus } from "lucide-react";
import { rotasBackbone as rotasPadrao } from "../data/rotas";
import useFirestoreCollection from '../hooks/useFirestoreCollection';
import { setRecord } from '../services/firestoreCrud';
import { useAuth } from '../context/AuthContext';
import "./Backbone.css";

const vazio={id:'',nome:'',nomeCompleto:'',origem:'',destino:'',distancia:'',fibras:'',status:'Operacional'};

function Backbone() {
  const {isAdmin}=useAuth();
  const {items}=useFirestoreCollection('rotasBackbone',{orderBy:'nome'});
  const rotas=useMemo(()=>{
    const map=new Map(rotasPadrao.map(r=>[r.id,r]));
    items.forEach(r=>map.set(r.id,{...map.get(r.id),...r}));
    return [...map.values()];
  },[items]);
  const [modal,setModal]=useState(false); const [form,setForm]=useState(vazio); const [saving,setSaving]=useState(false);

  function pedirAdmin(){window.dispatchEvent(new CustomEvent('open-admin-login'))}
  function abrirNovo(){if(!isAdmin)return pedirAdmin();setForm(vazio);setModal(true)}
  function editar(rota){if(!isAdmin)return pedirAdmin();setForm({...vazio,...rota,distancia:rota.distancia??'',fibras:rota.fibras??''});setModal(true)}
  async function salvar(e){
    e.preventDefault();
    if(!form.nome.trim()||!form.origem.trim()||!form.destino.trim())return alert('Informe nome, origem e destino.');
    const id=(form.id||form.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')).trim();
    setSaving(true);
    try{
      await setRecord('rotasBackbone',id,{...form,id,tipo:'backbone',distancia:Number(String(form.distancia).replace(',','.'))||0,fibras:Number(form.fibras)||0});
      setModal(false);
    }catch(err){console.error(err);alert('Não foi possível salvar a rota. Verifique o login e as regras do Firebase.')}finally{setSaving(false)}
  }

  return <div className="backbone-page">
    <div className="backbone-cabecalho"><div><span className="pagina-identificacao">Infraestrutura de transporte</span><h1>Rotas Backbone</h1><p>Documentação das rotas de fibra entre cidades e POPs.</p></div><button className={`botao-nova-rota ${!isAdmin?'admin-locked':''}`} onClick={abrirNovo} title={!isAdmin?'Entre na Administração para criar uma rota':''}><Plus size={18}/> Nova rota{!isAdmin?' 🔒':''}</button></div>
    <div className="backbone-grid">{rotas.map(rota=><article className="rota-card" key={rota.id}>
      <div className="rota-card-topo"><div className="rota-icone"><Network size={23}/></div><span className={`status-rota ${rota.status==='Operacional'?'status-operacional':'status-cadastro'}`}>{rota.status}</span></div>
      <h2>{rota.nome}</h2><p className="nome-completo">{rota.nomeCompleto||`${rota.origem} ↔ ${rota.destino}`}</p>
      <div className="rota-informacoes"><div><MapPin size={17}/><span><strong>Origem:</strong> {rota.origem}</span></div><div><MapPin size={17}/><span><strong>Destino:</strong> {rota.destino}</span></div><div><Cable size={17}/><span><strong>Distância:</strong> {rota.distancia>0?`${rota.distancia} km`:'Não informada'}</span></div><div><Cable size={17}/><span><strong>Cabo:</strong> {rota.fibras>0?`${rota.fibras} fibras`:'Não informado'}</span></div></div>
      <div className="backbone-actions"><Link className="botao-abrir-rota" to={`/backbone/${rota.id}`}>Abrir rota <ArrowRight size={18}/></Link><button className={`backbone-edit ${!isAdmin?'admin-locked':''}`} onClick={()=>editar(rota)} title={!isAdmin?'Entre na Administração para editar':''}><Pencil size={17}/> Editar{!isAdmin?' 🔒':''}</button></div>
    </article>)}</div>
    {modal&&<div className="modal-backdrop" onMouseDown={()=>setModal(false)}><div className="crud-modal" onMouseDown={e=>e.stopPropagation()}><div className="crud-modal-head"><h2>{form.id?'Editar rota':'Nova rota'}</h2><button onClick={()=>setModal(false)}>×</button></div><form className="crud-form" onSubmit={salvar}>
      <label><span>Nome *</span><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/></label><label><span>Nome completo</span><input value={form.nomeCompleto} onChange={e=>setForm({...form,nomeCompleto:e.target.value})}/></label><label><span>Origem *</span><input value={form.origem} onChange={e=>setForm({...form,origem:e.target.value})}/></label><label><span>Destino *</span><input value={form.destino} onChange={e=>setForm({...form,destino:e.target.value})}/></label><label><span>Distância (km)</span><input value={form.distancia} onChange={e=>setForm({...form,distancia:e.target.value})}/></label><label><span>Cabo (fibras)</span><input value={form.fibras} onChange={e=>setForm({...form,fibras:e.target.value})}/></label><label><span>Status</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Operacional</option><option>Em cadastro</option><option>Manutenção</option><option>Inativo</option></select></label><div className="crud-buttons full"><button type="button" className="botao-secundario" onClick={()=>setModal(false)}>Cancelar</button><button className="botao-primario" disabled={saving}>{saving?'Salvando...':'Salvar rota'}</button></div>
    </form></div></div>}
  </div>;
}
export default Backbone;
