import { Link } from "react-router-dom";
import { Network, MapPin, Cable, ArrowRight } from "lucide-react";

import { rotasBackbone } from "../data/rotas";

import "./Backbone.css";

function Backbone() {
  return (
    <div className="backbone-page">
      <div className="backbone-cabecalho">
        <div>
          <span className="pagina-identificacao">
            Infraestrutura de transporte
          </span>

          <h1>Rotas Backbone</h1>

          <p>
            Documentação das rotas de fibra entre cidades e POPs.
          </p>
        </div>

        <button className="botao-nova-rota">
          + Nova rota
        </button>
      </div>

      <div className="backbone-grid">
        {rotasBackbone.map((rota) => (
          <article className="rota-card" key={rota.id}>
            <div className="rota-card-topo">
              <div className="rota-icone">
                <Network size={23} />
              </div>

              <span
                className={`status-rota ${
                  rota.status === "Operacional"
                    ? "status-operacional"
                    : "status-cadastro"
                }`}
              >
                {rota.status}
              </span>
            </div>

            <h2>{rota.nome}</h2>

            <p className="nome-completo">
              {rota.nomeCompleto}
            </p>

            <div className="rota-informacoes">
              <div>
                <MapPin size={17} />

                <span>
                  <strong>Origem:</strong> {rota.origem}
                </span>
              </div>

              <div>
                <MapPin size={17} />

                <span>
                  <strong>Destino:</strong> {rota.destino}
                </span>
              </div>

              <div>
                <Cable size={17} />

                <span>
                  <strong>Distância:</strong>{" "}
                  {rota.distancia > 0
                    ? `${rota.distancia} km`
                    : "Não informada"}
                </span>
              </div>

              <div>
                <Cable size={17} />

                <span>
                  <strong>Cabo:</strong>{" "}
                  {rota.fibras > 0
                    ? `${rota.fibras} fibras`
                    : "Não informado"}
                </span>
              </div>
            </div>

            <Link
              className="botao-abrir-rota"
              to={`/backbone/${rota.id}`}
            >
              Abrir rota
              <ArrowRight size={18} />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Backbone;