import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { House, MapPin, Boxes, Cable, Plus, Search, Trash2, ArrowRight } from 'lucide-react';
import { lerDados, salvarDados, novoId } from '../utils/localData';
import './FTTH.css';

const KEY='fibrapro-ftth-redes';
const inicialPadrao=[{id:'ftth-malacacheta',nome:'Malacacheta',cidade:'Malacacheta',descricao:'Rede FTTH urbana',ctos:'0',cabos:'0',olts:'',status:'Operacional',latitude:'-17.845',longitude:'-42.076',observacao:''}];
const vazio={nome:'',cidade:'',descricao:'Rede FTTH urbana',ctos:'0',cabos:'0',olts:'',status:'Operacional',latitude:'',longitude:'',observacao:''};

export default function FTTH(){
 const [redes,setRedes]=useState(()=>{const dados=lerDados(KEY);return dados.length?dados:inicialPadrao});
 const [modal,setModal]=useState(false);const [form,setForm]=useState(vazio);const [q,setQ]=useState('');
 const filtradas=useMemo(()=>redes.filter(r=>JSON.stringify(r).toLowerCase().includes(q.toLowerCase())),[redes,q]);
 function persist(next){setRedes(next);salvarDados(KEY,next)}
 function salvar(e){e.preventDefault();if(!form.nome.trim())return alert('Informe o nome da rede FTTH.');persist([{...form,id:novoId('ftth'),criadoEm:new Date().toISOString()},...redes]);setForm(vazio);setModal(false)}
 function excluir(id){if(!confirm('Excluir esta rede FTTH?'))return;persist(redes.filter(r=>r.id!==id))}
 return <div className="ftth-page">
  <div className="ftth-cabecalho"><div><span>REDE DE ACESSO</span><h1>FTTH</h1><p>Redes urbanas, CTOs, cabos, OLTs, mapas e arquivos KMZ.</p></div><button onClick={()=>setModal(true)}><Plus size={17}/> Nova rede FTTH</button></div>
  <div className="ftth-toolbar"><Search size={18}/><input placeholder="Pesquisar rede, cidade ou status..." value={q} onChange={e=>setQ(e.target.value)}/><span>{filtradas.length} rede(s)</span></div>
  <div className="ftth-grid">{filtradas.map(rede=><div className="ftth-card" key={rede.id}><div className="ftth-card-top"><House size={27}/><span>{rede.status}</span></div><h2>{rede.nome}</h2><p>{rede.descricao||'Rede FTTH'}</p><div className="ftth-dados"><span><MapPin size={16}/>{rede.cidade||'Cidade não informada'}</span><span><Boxes size={16}/>CTOs: {rede.ctos||0}</span><span><Cable size={16}/>Cabos: {rede.cabos||0}</span></div><div className="ftth-actions"><Link className="abrir-ftth" to={`/ftth/${rede.id}`}><ArrowRight size={16}/> Abrir rede</Link><button className="excluir-ftth" onClick={()=>excluir(rede.id)}><Trash2 size={16}/></button></div></div>)}</div>
  {modal&&<div className="modal-backdrop" onMouseDown={()=>setModal(false)}><div className="crud-modal" onMouseDown={e=>e.stopPropagation()}><div className="crud-modal-head"><h2>Nova rede FTTH</h2><button onClick={()=>setModal(false)}>×</button></div><form className="crud-form" onSubmit={salvar}>
   <label><span>Nome da rede *</span><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/></label><label><span>Cidade</span><input value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})}/></label><label className="full"><span>Descrição</span><input value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})}/></label><label><span>Quantidade de CTOs</span><input type="number" value={form.ctos} onChange={e=>setForm({...form,ctos:e.target.value})}/></label><label><span>Quantidade de cabos</span><input type="number" value={form.cabos} onChange={e=>setForm({...form,cabos:e.target.value})}/></label><label><span>OLTs</span><input value={form.olts} onChange={e=>setForm({...form,olts:e.target.value})}/></label><label><span>Status</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Operacional</option><option>Implantação</option><option>Manutenção</option><option>Desativada</option></select></label><label><span>Latitude central</span><input value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})}/></label><label><span>Longitude central</span><input value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})}/></label><label className="full"><span>Observações</span><textarea value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})}/></label><div className="crud-buttons full"><button type="button" className="botao-secundario" onClick={()=>setModal(false)}>Cancelar</button><button className="botao-primario">Salvar rede</button></div>
  </form></div></div>}
 </div>
}
