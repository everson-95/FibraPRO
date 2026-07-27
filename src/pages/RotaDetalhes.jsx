import { useParams } from "react-router-dom";
import "./RotaDetalhes.css";

function RotaDetalhes() {
  const { id } = useParams();

  return (
    <div className="rota-detalhes">

      <div className="topo-rota">
        <div>
          <h1>Rota {id}</h1>
          <p>Status: Operacional</p>
        </div>

        <button className="btn-importar">
          Importar .SOR
        </button>
      </div>

      <div className="grid-cards">

        <div className="card card-otdr">
          <h2>📈 Curvas OTDR</h2>

          <div className="grafico">
            Em breve o gráfico OTDR aparecerá aqui.
          </div>
        </div>

        <div className="card">
          <h2>🗺 KMZ</h2>

          <button>Importar KMZ</button>
        </div>

        <div className="card">
          <h2>📦 CEOs</h2>

          <button>Adicionar CEO</button>
        </div>

        <div className="card">
          <h2>🧵 Cabos</h2>

          <button>Adicionar Cabo</button>
        </div>

        <div className="card">
          <h2>📍 CTOs</h2>

          <button>Adicionar CTO</button>
        </div>

      </div>

    </div>
  );
}

export default RotaDetalhes;