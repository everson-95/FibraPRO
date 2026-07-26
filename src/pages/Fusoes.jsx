import { Scissors } from 'lucide-react';
import CrudModule from '../components/CrudModule';
const fields=[
{name:'nome',label:'Identificação',required:true},{name:'rota',label:'Rota',required:true},{name:'ceo',label:'CEO',required:true},{name:'caboEntrada',label:'Cabo de entrada'},{name:'fibraEntrada',label:'FO de entrada'},{name:'caboSaida',label:'Cabo de saída'},{name:'fibraSaida',label:'FO de saída'},{name:'perda',label:'Perda (dB)'},{name:'status',label:'Status',type:'select',options:['Documentada','Pendente','Revisar'],defaultValue:'Documentada'},{name:'foto',label:'Foto da fusão / bandeja',type:'file',accept:'image/*',full:true},{name:'observacao',label:'Observações',type:'textarea',full:true}
];
export default function Fusoes(){return <CrudModule titulo="Fusões" subtitulo="Documentação de emendas, fibras de entrada e saída, perdas e registro fotográfico." storageKey="fibrapro-fusoes" fields={fields} cardTitle="nome" cardSubtitle="ceo" icon={Scissors}/>}
