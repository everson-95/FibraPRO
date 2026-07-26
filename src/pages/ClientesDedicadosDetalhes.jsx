import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Download, FileArchive, MapPin, Trash2, Upload } from 'lucide-react';
import MapaRota from '../components/mapa/MapaRota';
import { lerDados, salvarDados } from '../utils/localData';
import { deleteFile, getFile, openStoredFile, saveFile } from '../utils/fileStore';
import { parseMapFile } from '../utils/kmz';
import './DarkFiber.css';
import './ClientesDedicados.css';

const KEY='fibrapro-clientes';
function safe(value){const n=Number(String(value??'').replace(',','.'));return Number.isFinite(n)?n:null}
export default function ClientesDedicadosDetalhes(){
 const {id}=useParams();const item=lerDados(KEY).find(i=>i.id===id);const kmzKey=`fibrapro-clientes-kmz-${id}`;
 const [files,setFiles]=useState(()=>lerDados(kmzKey));const [mapData,setMapData]=useState({tracks:[],markers:[]});const [loading,setLoading]=useState(false);const [error,setError]=useState('');const input=useRef();
 useEffect(()=>{let active=true;(async()=>{if(!files.length){setMapData({tracks:[],markers:[]});return}setLoading(true);try{const parsed=await Promise.all(files.map(async meta=>{const stored=await getFile(meta.id);if(!stored)return null;const file=stored instanceof File?stored:new File([stored],meta.nome,{type:stored.type||meta.tipo||''});return parseMapFile(file)}));if(active)setMapData({tracks:parsed.filter(Boolean).flatMap(p=>p.tracks||[]),markers:parsed.filter(Boolean).flatMap(p=>p.markers||[])})}catch(e){if(active)setError(e.message||'Erro ao carregar KMZ.')}finally{if(active)setLoading(false)}})();return()=>{active=false}},[files]);
 if(!item)return <div className="dark-empty"><h2>Cliente não encontrado</h2><Link to="/clientes-dedicados">Voltar</Link></div>;
 async function enviar(e){const file=e.target.files?.[0];e.target.value='';if(!file)return;setLoading(true);setError('');try{const parsed=await parseMapFile(file);const fileId=`cliente-kmz-${id}-${Date.now()}`;await saveFile(fileId,file);const next=[{id:fileId,nome:file.name,tipo:file.type,tamanho:file.size,trechos:parsed.tracks.length,pontos:parsed.markers.length,data:new Date().toISOString()},...files];setFiles(next);salvarDados(kmzKey,next);setMapData(prev=>({tracks:[...parsed.tracks,...prev.tracks],markers:[...parsed.markers,...prev.markers]}))}catch(err){setError(err.message||'Não foi possível ler o arquivo.');alert(err.message||'Não foi possível ler o arquivo.')}finally{setLoading(false)}}
 async function excluir(meta){if(!confirm('Excluir este KMZ/KML?'))return;await deleteFile(meta.id);const next=files.filter(f=>f.id!==meta.id);setFiles(next);salvarDados(kmzKey,next)}
 const fallback=useMemo(()=>{const lat=safe(item.latitude),lng=safe(item.longitude);return lat!==null&&lng!==null?[{id:`cliente-${id}`,name:item.nome,description:item.rota,kind:'cliente',position:[lat,lng]}]:[]},[item,id]);
 return <div className="dark-page"><Link className="voltar-link" to="/clientes-dedicados"><ArrowLeft size={17}/> Voltar para Clientes Dedicados</Link>
  <header className="dark-header"><div><span className="pagina-identificacao">Circuito dedicado</span><h1>{item.nome}</h1><p>{item.rota||`${item.origem||'Origem'} → ${item.destino||'Destino'}`}</p></div><span className="dark-status">{item.status}</span></header>
  <div className="dark-detail-grid"><section className="dark-panel"><h2><Building2 size={20}/> Dados técnicos</h2><dl><div><dt>Velocidade</dt><dd>{item.velocidade||'—'}</dd></div><div><dt>Fibra</dt><dd>{item.fibra||'—'}</dd></div><div><dt>VLAN</dt><dd>{item.vlan||'—'}</dd></div><div><dt>IP</dt><dd>{item.ip||'—'}</dd></div><div><dt>Porta</dt><dd>{item.portaSwitch||'—'}</dd></div><div><dt>DIO</dt><dd>{item.dio||'—'}</dd></div></dl></section><section className="dark-panel"><h2><MapPin size={20}/> Trajeto</h2><dl><div><dt>Origem</dt><dd>{item.origem||'—'}</dd></div><div><dt>Destino</dt><dd>{item.destino||'—'}</dd></div><div><dt>SFP</dt><dd>{item.sfp||'—'}</dd></div><div><dt>Observações</dt><dd>{item.observacao||'—'}</dd></div></dl></section></div>
  <section className="dark-panel"><div className="dark-section-head"><div><h2><MapPin size={20}/> Mapa do circuito</h2><p>Importe o KMZ/KML do cliente para visualizar o trajeto dentro ou fora da cidade.</p></div><button className="botao-primario" onClick={()=>input.current?.click()} disabled={loading}><Upload size={17}/>{loading?'Processando...':'Adicionar KMZ/KML'}</button><input ref={input} hidden type="file" accept=".kmz,.kml" onChange={enviar}/></div>{error&&<div className="ftth-map-error">{error}</div>}<MapaRota points={mapData.markers.length?mapData.markers:fallback} tracks={mapData.tracks} center={fallback[0]?.position} enableLocation showLayerControl height={520}/>
   {files.length>0&&<div className="kmz-list">{files.map(f=><article key={f.id}><div><FileArchive size={18}/><span><strong>{f.nome}</strong><small>{f.trechos} trecho(s) · {f.pontos} ponto(s)</small></span></div><div><button onClick={()=>openStoredFile(f.id,f.nome)} title="Baixar"><Download size={17}/></button><button className="danger" onClick={()=>excluir(f)} title="Excluir"><Trash2 size={17}/></button></div></article>)}</div>}
  </section>
 </div>
}
