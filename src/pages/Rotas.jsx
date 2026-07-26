import { Link } from "react-router-dom";
import { rotas } from "../data/rotas";

function Rotas() {
  return (
    <div>
      <h1>Rotas Backbone</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginTop: "25px",
        }}
      >
        {rotas.map((rota) => (
          <div
            key={rota.id}
            style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
            }}
          >
            <h2>{rota.nome}</h2>

            <p>
              <strong>Origem:</strong> {rota.origem}
            </p>

            <p>
              <strong>Destino:</strong> {rota.destino}
            </p>

            <p>
              <strong>Distância:</strong>{" "}
              {rota.distancia > 0 ? `${rota.distancia} km` : "Não informada"}
            </p>

            <p>
              <strong>Fibras:</strong>{" "}
              {rota.fibras > 0 ? `${rota.fibras} FO` : "Não informado"}
            </p>

            <p>
              <strong>Status:</strong> {rota.status}
            </p>

            <Link
              to={`/rotas/${rota.id}`}
              style={{
                display: "inline-block",
                marginTop: "10px",
                background: "#2563eb",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Abrir rota
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rotas;