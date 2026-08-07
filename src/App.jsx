import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import POPs from "./pages/POPs";
import POPDetalhes from "./pages/POPDetalhes";
import Backbone from "./pages/Backbone";
import FTTH from "./pages/FTTH";
import FTTHDetalhes from "./pages/FTTHDetalhes";

import CEOs from "./pages/CEOs";
import CEODetalhes from "./pages/CEODetalhes";

import DarkFiber from "./pages/DarkFiber";
import DarkFiberDetalhes from "./pages/DarkFiberDetalhes";
import ClientesDedicados from "./pages/ClientesDedicados";
import ClientesDedicadosDetalhes from "./pages/ClientesDedicadosDetalhes";

import RotaDetalhes from "./pages/RotaDetalhes";
import Cabos from "./pages/Cabos";
import Fusoes from "./pages/Fusoes";
import Arquivos from "./pages/Arquivos";
import Pesquisa from "./pages/Pesquisa";
import Configuracoes from "./pages/Configuracoes";

import "./styles/fibrapro.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">

        <Sidebar />

        <main className="conteudo-principal">

          <Routes>

            <Route path="/" element={<Dashboard />} />

            <Route path="/pops" element={<POPs />} />
            <Route path="/pops/:id" element={<POPDetalhes />} />

            <Route path="/backbone" element={<Backbone />} />

            <Route path="/backbone/:id" element={<RotaDetalhes />} />

            <Route path="/ceos" element={<CEOs />} />

            <Route path="/ceos/:id" element={<CEODetalhes />} />

            <Route path="/darkfiber" element={<DarkFiber />} />
            <Route path="/darkfiber/:id" element={<DarkFiberDetalhes />} />

            <Route path="/clientes-dedicados" element={<ClientesDedicados />} />
            <Route path="/clientes-dedicados/:id" element={<ClientesDedicadosDetalhes />} />

            <Route path="/ftth" element={<FTTH />} />
            <Route path="/ftth/:id" element={<FTTHDetalhes />} />
            <Route path="/cabos" element={<Cabos />} />
            <Route path="/fusoes" element={<Fusoes />} />
            <Route path="/arquivos" element={<Arquivos />} />
            <Route path="/pesquisa" element={<Pesquisa />} />
            <Route path="/configuracoes" element={<Configuracoes />} />

          </Routes>

        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;