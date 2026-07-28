import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
  Map,
  Activity,
  Boxes,
  Cable,
  Scissors,
  FileText,
  Network,
  Server,
  Plug,
  CircleDot,
  Upload,
  Download,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react";

import { rotasBackbone } from "../data/rotas";

import MapaRota from "../components/mapa/MapaRota";
import OtdrModal from "../components/OtdrModal";

import "./RotaDetalhes.css";

const BANCO_OTDR = "fibrapro-arquivos";
const VERSAO_BANCO = 1;
const STORE_OTDR = "arquivos-otdr";

function abrirBancoArquivos() {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(
      BANCO_OTDR,
      VERSAO_BANCO
    );

    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result;

      if (
        !banco.objectStoreNames.contains(
          STORE_OTDR
        )
      ) {
        banco.createObjectStore(
          STORE_OTDR,
          {
            keyPath: "id",
          }
        );
      }
    };

    requisicao.onsuccess = () => {
      resolve(requisicao.result);
    };

    requisicao.onerror = () => {
      reject(requisicao.error);
    };
  });
}

async function salvarArquivoOtdr(
  id,
  arquivo
) {
  const banco =
    await abrirBancoArquivos();

  return new Promise(
    (resolve, reject) => {
      const transacao =
        banco.transaction(
          STORE_OTDR,
          "readwrite"
        );

      const store =
        transacao.objectStore(
          STORE_OTDR
        );

      store.put({
        id,
        arquivo,
      });

      transacao.oncomplete = () => {
        banco.close();
        resolve();
      };

      transacao.onerror = () => {
        banco.close();
        reject(transacao.error);
      };
    }
  );
}

async function buscarArquivoOtdr(id) {
  const banco =
    await abrirBancoArquivos();

  return new Promise(
    (resolve, reject) => {
      const transacao =
        banco.transaction(
          STORE_OTDR,
          "readonly"
        );

      const store =
        transacao.objectStore(
          STORE_OTDR
        );

      const requisicao =
        store.get(id);

      requisicao.onsuccess = () => {
        banco.close();

        resolve(
          requisicao.result?.arquivo ||
            null
        );
      };

      requisicao.onerror = () => {
        banco.close();
        reject(requisicao.error);
      };
    }
  );
}

async function excluirArquivoOtdr(id) {
  const banco =
    await abrirBancoArquivos();

  return new Promise(
    (resolve, reject) => {
      const transacao =
        banco.transaction(
          STORE_OTDR,
          "readwrite"
        );

      const store =
        transacao.objectStore(
          STORE_OTDR
        );

      store.delete(id);

      transacao.oncomplete = () => {
        banco.close();
        resolve();
      };

      transacao.onerror = () => {
        banco.close();
        reject(transacao.error);
      };
    }
  );
}

function CampoDetalhe({
  icone,
  titulo,
  valor,
}) {
  return (
    <div className="campo-detalhe">
      <div className="campo-detalhe-icone">
        {icone}
      </div>

      <div>
        <span>{titulo}</span>

        <strong>
          {valor || "Não informado"}
        </strong>
      </div>
    </div>
  );
}

function TerminacaoCard({
  titulo,
  cidade,
  dados,
}) {
  return (
    <article className="terminacao-card">
      <div className="terminacao-topo">
        <div>
          <span>{titulo}</span>
          <h3>{cidade}</h3>
        </div>

        <div className="terminacao-icone">
          <Network size={22} />
        </div>
      </div>

      <div className="terminacao-dados">
        <CampoDetalhe
          icone={<Map size={17} />}
          titulo="POP"
          valor={dados?.pop}
        />

        <CampoDetalhe
          icone={<Server size={17} />}
          titulo="Equipamento"
          valor={dados?.equipamento}
        />

        <CampoDetalhe
          icone={<Server size={17} />}
          titulo="Modelo"
          valor={dados?.modelo}
        />

        <CampoDetalhe
          icone={<Plug size={17} />}
          titulo="Porta do switch"
          valor={dados?.portaSwitch}
        />

        <CampoDetalhe
          icone={<Boxes size={17} />}
          titulo="DIO"
          valor={dados?.dio}
        />

        <CampoDetalhe
          icone={<CircleDot size={17} />}
          titulo="Porta do DIO"
          valor={dados?.portaDio}
        />

        <CampoDetalhe
          icone={<Cable size={17} />}
          titulo="Fibra"
          valor={dados?.fibra}
        />

        <CampoDetalhe
          icone={<Activity size={17} />}
          titulo="SFP"
          valor={dados?.sfp}
        />
      </div>

      {dados?.observacao && (
        <div className="terminacao-observacao">
          <strong>Observação</strong>
          <p>{dados.observacao}</p>
        </div>
      )}
    </article>
  );
}

function RotaDetalhes() {
  const { id } = useParams();

  const [modalAberto, setModalAberto] =
    useState(false);

  const [curvasOtdr, setCurvasOtdr] =
    useState([]);

  const rota = rotasBackbone.find(
    (item) => item.id === id
  );

  const chaveLocalStorage =
    `fibrapro-otdr-${id}`;

  useEffect(() => {
    const dadosSalvos =
      localStorage.getItem(
        chaveLocalStorage
      );

    if (!dadosSalvos) {
      setCurvasOtdr([]);
      return;
    }

    try {
      const curvas =
        JSON.parse(dadosSalvos);

      setCurvasOtdr(
        Array.isArray(curvas)
          ? curvas
          : []
      );
    } catch {
      setCurvasOtdr([]);
    }
  }, [chaveLocalStorage]);

  function salvarLista(curvas) {
    setCurvasOtdr(curvas);

    localStorage.setItem(
      chaveLocalStorage,
      JSON.stringify(curvas)
    );
  }

  async function salvarCurva(dados) {
    const idCurva =
      `otdr-${Date.now()}`;

    const novaCurva = {
      id: idCurva,
      fibra: dados.fibra,
      sentido: dados.sentido,
      comprimentoOnda:
        dados.comprimentoOnda,
      distancia: dados.distancia,
      perdaTotal: dados.perdaTotal,
      dataMedicao:
        dados.dataMedicao,
      equipamento:
        dados.equipamento,
      observacao:
        dados.observacao,
      nomeArquivo:
        dados.arquivo.name,
      tipoArquivo:
        dados.arquivo.type,
      tamanhoArquivo:
        dados.arquivo.size,
      criadoEm:
        new Date().toISOString(),
    };

    try {
      await salvarArquivoOtdr(
        idCurva,
        dados.arquivo
      );

      salvarLista([
        novaCurva,
        ...curvasOtdr,
      ]);

      setModalAberto(false);
    } catch (erro) {
      console.error(
        "Erro ao salvar arquivo OTDR:",
        erro
      );

      alert(
        "Não foi possível salvar o arquivo no navegador."
      );
    }
  }

  async function abrirArquivo(curva) {
    try {
      const arquivo =
        await buscarArquivoOtdr(
          curva.id
        );

      if (!arquivo) {
        alert(
          "O arquivo desta curva não foi encontrado."
        );

        return;
      }

      const url =
        URL.createObjectURL(arquivo);

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (erro) {
      console.error(erro);

      alert(
        "Não foi possível abrir o arquivo."
      );
    }
  }

  async function baixarArquivo(curva) {
    try {
      const arquivo =
        await buscarArquivoOtdr(
          curva.id
        );

      if (!arquivo) {
        alert(
          "O arquivo desta curva não foi encontrado."
        );

        return;
      }

      const url =
        URL.createObjectURL(arquivo);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        curva.nomeArquivo ||
        "curva-otdr";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (erro) {
      console.error(erro);

      alert(
        "Não foi possível baixar o arquivo."
      );
    }
  }

  async function excluirCurva(curva) {
    const confirmar =
      window.confirm(
        `Excluir a curva da ${curva.fibra}?`
      );

    if (!confirmar) {
      return;
    }

    try {
      await excluirArquivoOtdr(
        curva.id
      );

      const novaLista =
        curvasOtdr.filter(
          (item) =>
            item.id !== curva.id
        );

      salvarLista(novaLista);
    } catch (erro) {
      console.error(erro);

      alert(
        "Não foi possível excluir a curva."
      );
    }
  }

  function formatarTamanho(bytes) {
    if (!bytes) {
      return "0 KB";
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function formatarData(data) {
    if (!data) {
      return "Não informada";
    }

    return new Date(
      `${data}T12:00:00`
    ).toLocaleDateString(
      "pt-BR"
    );
  }

  if (!rota) {
    return (
      <div className="rota-nao-encontrada">
        <h1>Rota não encontrada</h1>

        <Link to="/backbone">
          Voltar para Backbone
        </Link>
      </div>
    );
  }

  return (
    <div className="rota-detalhes">
      <Link
        className="voltar-backbone"
        to="/backbone"
      >
        <ArrowLeft size={18} />
        Voltar para Backbone
      </Link>

      <header className="rota-detalhes-topo">
        <div>
          <span className="rota-tipo">
            Rota Backbone
          </span>

          <h1>{rota.nome}</h1>
          <p>{rota.nomeCompleto}</p>
        </div>

        <div
          className={`status-rota ${
            rota.status === "Operacional"
              ? "status-operacional"
              : "status-cadastro"
          }`}
        >
          {rota.status}
        </div>
      </header>

      <section className="resumo-rota-grid">
        <div className="resumo-rota-card">
          <span>Origem</span>
          <strong>{rota.origem}</strong>
        </div>

        <div className="resumo-rota-card">
          <span>Destino</span>
          <strong>{rota.destino}</strong>
        </div>

        <div className="resumo-rota-card">
          <span>Distância</span>

          <strong>
            {rota.distancia > 0
              ? `${rota.distancia} km`
              : "Não informada"}
          </strong>
        </div>

        <div className="resumo-rota-card">
          <span>Cabo principal</span>

          <strong>
            {rota.fibras > 0
              ? `${rota.fibras} fibras`
              : "Não informado"}
          </strong>
        </div>
      </section>

      <section className="secao-rota">
        <div className="secao-rota-topo">
          <div>
            <span>
              Portas e equipamentos
            </span>

            <h2>
              Terminações do enlace
            </h2>

            <p>
              Pontas utilizadas durante
              testes e medições.
            </p>
          </div>
        </div>

        <div className="terminacoes-grid">
          <TerminacaoCard
            titulo="Ponta A"
            cidade={rota.origem}
            dados={rota.pontaA}
          />

          <div className="ligacao-terminacoes">
            <span>PONTA A</span>

            <div className="linha-enlace">
              <Cable size={27} />
            </div>

            <span>PONTA B</span>
          </div>

          <TerminacaoCard
            titulo="Ponta B"
            cidade={rota.destino}
            dados={rota.pontaB}
          />
        </div>
      </section>

      <section className="secao-rota">
        <div className="secao-rota-topo">
          <div>
            <span>
              Visualização geográfica
            </span>

            <h2>Mapa da rota</h2>

            <p>
              Traçado, CEOs e pontos
              importantes.
            </p>
          </div>

          <button className="botao-primario">
            <Upload size={17} />
            Upload KMZ
          </button>
        </div>

        <div className="mapa-rota-card">
          <MapaRota />
        </div>
      </section>

      <section className="secao-rota">
        <div className="secao-rota-topo">
          <div>
            <span>Medições ópticas</span>

            <h2>Curvas OTDR</h2>

            <p>
              Curvas cadastradas nesta
              rota.
            </p>
          </div>

          <button
            className="botao-primario"
            onClick={() =>
              setModalAberto(true)
            }
          >
            <Upload size={17} />
            Upload OTDR
          </button>
        </div>

        {curvasOtdr.length === 0 ? (
          <div className="otdr-vazio">
            <div className="otdr-vazio-icone">
              <Activity size={30} />
            </div>

            <h3>
              Nenhuma curva cadastrada
            </h3>

            <p>
              Adicione uma curva OTDR
              para documentar esta rota.
            </p>

            <button
              className="botao-adicionar-otdr"
              onClick={() =>
                setModalAberto(true)
              }
            >
              <Upload size={17} />
              Adicionar primeira curva
            </button>
          </div>
        ) : (
          <div className="otdr-lista">
            {curvasOtdr.map(
              (curva) => (
                <article
                  className="otdr-card"
                  key={curva.id}
                >
                  <div className="otdr-card-icone">
                    <Activity size={25} />
                  </div>

                  <div className="otdr-card-conteudo">
                    <div className="otdr-card-titulo">
                      <div>
                        <h3>
                          {curva.fibra}
                        </h3>

                        <p>
                          {curva.sentido}
                        </p>
                      </div>

                      <span className="otdr-onda">
                        {
                          curva.comprimentoOnda
                        }{" "}
                        nm
                      </span>
                    </div>

                    <div className="otdr-card-informacoes">
                      <span>
                        <strong>
                          Distância:
                        </strong>{" "}
                        {curva.distancia
                          ? `${curva.distancia} km`
                          : "Não informada"}
                      </span>

                      <span>
                        <strong>
                          Perda total:
                        </strong>{" "}
                        {curva.perdaTotal
                          ? `${curva.perdaTotal} dB`
                          : "Não informada"}
                      </span>

                      <span>
                        <strong>
                          Equipamento:
                        </strong>{" "}
                        {curva.equipamento ||
                          "Não informado"}
                      </span>

                      <span>
                        <Calendar
                          size={14}
                        />

                        {formatarData(
                          curva.dataMedicao
                        )}
                      </span>
                    </div>

                    <div className="otdr-arquivo-info">
                      <FileText
                        size={17}
                      />

                      <div>
                        <strong>
                          {
                            curva.nomeArquivo
                          }
                        </strong>

                        <span>
                          {formatarTamanho(
                            curva.tamanhoArquivo
                          )}
                        </span>
                      </div>
                    </div>

                    {curva.observacao && (
                      <div className="otdr-observacao">
                        <strong>
                          Observação
                        </strong>

                        <p>
                          {
                            curva.observacao
                          }
                        </p>
                      </div>
                    )}

                    <div className="otdr-card-acoes">
                      <button
                        onClick={() =>
                          abrirArquivo(
                            curva
                          )
                        }
                      >
                        <Eye size={16} />
                        Abrir
                      </button>

                      <button
                        onClick={() =>
                          baixarArquivo(
                            curva
                          )
                        }
                      >
                        <Download
                          size={16}
                        />
                        Baixar
                      </button>

                      <button
                        className="botao-excluir-otdr"
                        onClick={() =>
                          excluirCurva(
                            curva
                          )
                        }
                      >
                        <Trash2
                          size={16}
                        />
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <section className="secao-rota">
        <div className="secao-rota-topo">
          <div>
            <span>Documentação</span>
            <h2>Elementos da rota</h2>
          </div>
        </div>

        <div className="modulos-rota-grid">
          <article className="modulo-rota-card">
  <Boxes size={23} />

  <h3>CEOs</h3>

  <p>
    Caixas de emenda da rota.
  </p>

  <Link
    to={`/ceos?rota=${rota.nome}`}
    className="btn-link"
  >
    <button>
      Abrir CEOs
    </button>
  </Link>

</article>

          <article className="modulo-rota-card">
            <Cable size={23} />
            <h3>Cabos</h3>
            <p>
              Cabos utilizados na rota.
            </p>
            <Link to={`/cabos?rota=${encodeURIComponent(rota.nome)}`}><button>Abrir cabos</button></Link>
          </article>

          <article className="modulo-rota-card">
            <Scissors size={23} />
            <h3>Fusões</h3>
            <p>
              Documentação das fusões.
            </p>
            <Link to={`/fusoes?rota=${encodeURIComponent(rota.nome)}`}><button>Abrir fusões</button></Link>
          </article>

          <article className="modulo-rota-card">
            <FileText size={23} />
            <h3>Arquivos</h3>
            <p>
              Fotos e documentos.
            </p>
            <Link to={`/arquivos?rota=${encodeURIComponent(rota.nome)}`}><button>Abrir arquivos</button></Link>
          </article>
        </div>
      </section>

      <OtdrModal
        aberto={modalAberto}
        aoFechar={() =>
          setModalAberto(false)
        }
        aoSalvar={salvarCurva}
        origem={rota.origem}
        destino={rota.destino}
      />
    </div>
  );
}

export default RotaDetalhes;