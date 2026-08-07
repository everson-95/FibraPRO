import { useEffect, useState } from 'react';
import { NavLink } from "react-router-dom";
import { Home, Network, House, Boxes, Cable, Building2, Search, Settings, Scissors, FileText, LockKeyhole, LogOut } from "lucide-react";
import logo from '../assets/north-logo.png';
import { useAuth } from '../context/AuthContext';
import AdminLoginModal from './AdminLoginModal';
import "./Sidebar.css";

const items=[['/','Dashboard',Home,true],['/pops','POPs',Building2],['/backbone','Backbone',Network],['/ceos','CEOs',Boxes],['/cabos','Cabos',Cable],['/fusoes','Fusões',Scissors],['/darkfiber','Dark Fiber',Cable],['/clientes-dedicados','Clientes Dedicados',Building2],['/ftth','FTTH',House],['/arquivos','Arquivos',FileText],['/pesquisa','Pesquisa',Search],['/configuracoes','Configurações',Settings]];

export default function Sidebar(){
 const [loginOpen,setLoginOpen]=useState(false);
 const {isAdmin,logout}=useAuth();

 useEffect(()=>{
   const abrir=()=>setLoginOpen(true);
   window.addEventListener('open-admin-login',abrir);
   return ()=>window.removeEventListener('open-admin-login',abrir);
 },[]);

 return <>
  <aside className="sidebar">
   <div className="sidebar-logo"><img src={logo} alt="North Tecnologia"/><div><h2>FibraPRO</h2><span>Plataforma de Gestão da Infraestrutura Óptica</span></div></div>

   <div className="sidebar-admin">
    {isAdmin ? <>
      <span className="admin-active">✓ Administrador conectado</span>
      <button type="button" onClick={logout}><LogOut size={17}/> Sair da administração</button>
    </> : <button type="button" className="admin-login-button" onClick={()=>setLoginOpen(true)}><LockKeyhole size={17}/> Administração</button>}
   </div>

   <nav className="sidebar-menu">{items.map(([to,label,Icon,end])=><NavLink key={to} to={to} end={end} className={({isActive})=>isActive?'menu-link ativo':'menu-link'}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
   <div className="sidebar-status"><i/> Sistema operacional</div>
  </aside>
  {loginOpen && <AdminLoginModal onClose={()=>setLoginOpen(false)}/>} 
 </>;
}
