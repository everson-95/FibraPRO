import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";

import { buscarCEO } from "../services/ceos";

import "./CEODetalhes.css";

function CEODetalhes() {

    const { id } = useParams();

    const [ceo, setCeo] = useState(null);

    useEffect(() => {
        carregarCEO();
    }, []);

    async function carregarCEO() {

        const dados = await buscarCEO(id);

        setCeo(dados);

    }

    if (!ceo) {
        return <h2>Carregando...</h2>;
    }

    return (

        <div className="paginaCEO">

            <div className="cabecalhoCEO">

                <h1>{ceo.nome}</h1>

                <span className={`status ${ceo.status?.toLowerCase()}`}>
                    {ceo.status}
                </span>

            </div>

            <div className="gridCEO">

                <div className="box">

                    <h2>Informações</h2>

                    <p><strong>Tipo:</strong> {ceo.tipo}</p>

                    <p><strong>Rota:</strong> {ceo.rota}</p>

                    <p><strong>KM:</strong> {ceo.km}</p>

                    <p><strong>Referência:</strong> {ceo.referencia}</p>

                    <p><strong>Latitude:</strong> {ceo.latitude}</p>

                    <p><strong>Longitude:</strong> {ceo.longitude}</p>

                    {ceo.maps && (
                        <a
                            href={ceo.maps}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Abrir Google Maps
                        </a>
                    )}

                </div>

                <div className="box">

                    <h2>Observações</h2>

                    <p>{ceo.observacao || "Nenhuma observação cadastrada."}</p>

                </div>

                <div className="box">

                    <h2>Cabos</h2>

                    <Link to={`/cabos?ceo=${encodeURIComponent(ceo.nome)}`}><button>Adicionar cabo</button></Link>

                </div>

                <div className="box">

                    <h2>Fusões</h2>

                    <Link to={`/fusoes?ceo=${encodeURIComponent(ceo.nome)}`}><button>Adicionar fusão</button></Link>

                </div>

                <div className="box">

                    <h2>Curvas OTDR</h2>

                    <Link to="/arquivos"><button>Enviar PDF</button></Link>

                </div>

                <div className="box">

                    <h2>Fotos</h2>

                    <Link to="/arquivos"><button>Enviar foto</button></Link>

                </div>

                <div className="box">

                    <h2>Histórico</h2>

                    <button>Adicionar histórico</button>

                </div>

            </div>

        </div>

    );

}

export default CEODetalhes;