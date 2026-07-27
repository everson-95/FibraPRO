import { Network, Boxes, Cable, Scissors, Building2, Activity } from 'lucide-react';
import { rotasBackbone } from '../data/rotas';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
export default function Dashboard(){
 const cabos=useFirestoreCollection('cabos').items; const fusoes=useFirestoreCollection('fusoes').items; const dark=useFirestoreCollection('darkFiber').items; const clientes=useFirestoreCollection('clientesDedicados').items; const arquivos=useFirestoreCollection('arquivos').items;
 const cards=[['Rotas Backbone',rotasBackbone.length,Network],['Cabos',cabos.length,Cable],['Fusões',fusoes.length,Scissors],['Dark Fiber',dark.length,Activity],['Clientes Dedicados',clientes.length,Building2],['Arquivos',arquivos.length,Boxes]];
 return <div className="modulo-page"><header className="modulo-header"><div><span className="pagina-identificacao">NORTH TECNOLOGIA</span><h1>Centro de Operações da Rede Óptica</h1><p>Indicadores sincronizados pelo Firebase.</p></div></header><div className="modulo-grid">{cards.map(([t,n,I])=><article className="modulo-card" key={t}><div className="modulo-card-icon"><I/></div><h2>{t}</h2><strong style={{fontSize:36,color:'#fff'}}>{n}</strong><p>registros na nuvem</p></article>)}</div></div>
}
