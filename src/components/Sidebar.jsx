import { NavLink } from "react-router-dom";
import { Home, Network, House, Boxes, Cable, Building2, Search, Settings, Scissors, FileText } from "lucide-react";
import logo from '../assets/north-logo.png';
import "./Sidebar.css";
const items=[['/','Dashboard',Home,true],['/backbone','Backbone',Network],['/ceos','CEOs',Boxes],['/cabos','Cabos',Cable],['/fusoes','Fusões',Scissors],['/darkfiber','Dark Fiber',Cable],['/clientes-dedicados','Clientes Dedicados',Building2],['/ftth','FTTH',House],['/arquivos','Arquivos',FileText],['/pesquisa','Pesquisa',Search],['/configuracoes','Configurações',Settings]];
export default function Sidebar(){return <aside className="sidebar"><div className="sidebar-logo"><img src={logo} alt="North Tecnologia"/><div><h2>FibraPRO</h2><span>Plataforma de Gestão da Infraestrutura Óptica</span></div></div><nav className="sidebar-menu">{items.map(([to,label,Icon,end])=><NavLink key={to} to={to} end={end} className={({isActive})=>isActive?'menu-link ativo':'menu-link'}><Icon size={19}/><span>{label}</span></NavLink>)}</nav><div className="sidebar-status"><i/> Sistema operacional</div></aside>}
