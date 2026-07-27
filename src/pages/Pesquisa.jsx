import { useMemo,useState } from 'react';
import { Search } from 'lucide-react';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
export default function Pesquisa(){
 const[q,setQ]=useState('');
 const dark=useFirestoreCollection('darkFiber').items,clientes=useFirestoreCollection('clientesDedicados').items,cabos=useFirestoreCollection('cabos').items,fusoes=useFirestoreCollection('fusoes').items,arquivos=useFirestoreCollection('arquivos').items,ftth=useFirestoreCollection('ftthRedes').items,ceos=useFirestoreCollection('ceos').items;
 const all=useMemo(()=>[['Dark Fiber',dark],['Clientes',clientes],['Cabos',cabos],['Fusões',fusoes],['Arquivos',arquivos],['FTTH',ftth],['CEOs',ceos]],[dark,clientes,cabos,fusoes,arquivos,ftth,ceos]);
 const result=q?all.flatMap(([tipo,arr])=>arr.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).map(x=>({tipo,...x}))):[];
 return <div className="modulo-page"><header className="modulo-header"><div><span className="pagina-identificacao">NORTH TECNOLOGIA</span><h1>Pesquisa Global</h1><p>Pesquise nos dados sincronizados do Firebase.</p></div></header><div className="modulo-toolbar"><Search/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Cliente, rota, cabo, fibra, VLAN, CEO..."/></div><div className="modulo-grid">{result.map((x,i)=><article className="modulo-card" key={`${x.tipo}-${x.id||i}`}><span className="modulo-badge">{x.tipo}</span><h2>{x.nome||x.cliente||'Registro'}</h2><p>{x.rota||x.observacao||'Sem detalhes'}</p></article>)}</div></div>
}
