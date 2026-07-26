import { useEffect, useState } from "react";
import {
  X,
  Upload,
  Save,
  FileText,
} from "lucide-react";

import "./OtdrModal.css";

const estadoInicial = {
  fibra: "",
  sentido: "",
  comprimentoOnda: "1550",
  distancia: "",
  perdaTotal: "",
  dataMedicao: "",
  equipamento: "",
  observacao: "",
};

function OtdrModal({
  aberto,
  aoFechar,
  aoSalvar,
  origem,
  destino,
}) {
  const [formulario, setFormulario] =
    useState(estadoInicial);

  const [arquivo, setArquivo] =
    useState(null);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    if (!aberto) {
      return;
    }

    setFormulario({
      ...estadoInicial,
      dataMedicao: new Date()
        .toISOString()
        .split("T")[0],
    });

    setArquivo(null);
    setErro("");
  }, [aberto]);

  if (!aberto) {
    return null;
  }

  function alterarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function selecionarArquivo(evento) {
    const arquivoSelecionado =
      evento.target.files?.[0];

    if (!arquivoSelecionado) {
      return;
    }

    const nome =
      arquivoSelecionado.name.toLowerCase();

    const extensoesPermitidas = [
      ".sor",
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg",
    ];

    const permitido =
      extensoesPermitidas.some(
        (extensao) =>
          nome.endsWith(extensao)
      );

    if (!permitido) {
      setArquivo(null);

      setErro(
        "Selecione um arquivo SOR, PDF, PNG, JPG ou JPEG."
      );

      evento.target.value = "";
      return;
    }

    setErro("");
    setArquivo(arquivoSelecionado);
  }

  function salvar(evento) {
    evento.preventDefault();

    if (!formulario.fibra.trim()) {
      setErro(
        "Informe o número da fibra."
      );

      return;
    }

    if (!formulario.sentido) {
      setErro(
        "Selecione o sentido da medição."
      );

      return;
    }

    if (!arquivo) {
      setErro(
        "Selecione o arquivo da curva OTDR."
      );

      return;
    }

    setErro("");

    aoSalvar({
      ...formulario,
      arquivo,
    });
  }

  return (
    <div
      className="otdr-modal-fundo"
      onMouseDown={aoFechar}
    >
      <div
        className="otdr-modal"
        onMouseDown={(evento) =>
          evento.stopPropagation()
        }
      >
        <div className="otdr-modal-topo">
          <div>
            <span>Medição óptica</span>

            <h2>
              Adicionar curva OTDR
            </h2>

            <p>
              Cadastre a curva e as
              informações da medição.
            </p>
          </div>

          <button
            type="button"
            className="otdr-modal-fechar"
            onClick={aoFechar}
            aria-label="Fechar formulário"
          >
            <X size={21} />
          </button>
        </div>

        <form
          className="otdr-formulario"
          onSubmit={salvar}
        >
          <div className="otdr-form-grid">
            <label>
              Fibra medida
              <input
                type="text"
                name="fibra"
                value={formulario.fibra}
                onChange={alterarCampo}
                placeholder="Ex.: Fibra 07"
              />
            </label>

            <label>
              Sentido da medição
              <select
                name="sentido"
                value={formulario.sentido}
                onChange={alterarCampo}
              >
                <option value="">
                  Selecione
                </option>

                <option
                  value={`${origem} → ${destino}`}
                >
                  {origem} → {destino}
                </option>

                <option
                  value={`${destino} → ${origem}`}
                >
                  {destino} → {origem}
                </option>
              </select>
            </label>

            <label>
              Comprimento de onda
              <select
                name="comprimentoOnda"
                value={
                  formulario.comprimentoOnda
                }
                onChange={alterarCampo}
              >
                <option value="1310">
                  1310 nm
                </option>

                <option value="1550">
                  1550 nm
                </option>

                <option value="1625">
                  1625 nm
                </option>

                <option value="1650">
                  1650 nm
                </option>
              </select>
            </label>

            <label>
              Data da medição
              <input
                type="date"
                name="dataMedicao"
                value={
                  formulario.dataMedicao
                }
                onChange={alterarCampo}
              />
            </label>

            <label>
              Distância medida
              <input
                type="number"
                name="distancia"
                value={
                  formulario.distancia
                }
                onChange={alterarCampo}
                placeholder="Ex.: 54.8"
                step="0.001"
                min="0"
              />
              <small>Valor em quilômetros</small>
            </label>

            <label>
              Perda total
              <input
                type="number"
                name="perdaTotal"
                value={
                  formulario.perdaTotal
                }
                onChange={alterarCampo}
                placeholder="Ex.: 12.5"
                step="0.01"
              />
              <small>Valor em dB</small>
            </label>

            <label className="campo-largo">
              Equipamento utilizado
              <input
                type="text"
                name="equipamento"
                value={
                  formulario.equipamento
                }
                onChange={alterarCampo}
                placeholder="Ex.: OTDR Yokogawa AQ1210"
              />
            </label>

            <label className="campo-largo">
              Observação
              <textarea
                name="observacao"
                value={
                  formulario.observacao
                }
                onChange={alterarCampo}
                placeholder="Ex.: Curva realizada após manutenção da rota."
                rows="3"
              />
            </label>
          </div>

          <label className="otdr-arquivo-area">
            <input
              type="file"
              accept=".sor,.pdf,.png,.jpg,.jpeg"
              onChange={selecionarArquivo}
            />

            <div className="otdr-arquivo-icone">
              {arquivo ? (
                <FileText size={27} />
              ) : (
                <Upload size={27} />
              )}
            </div>

            <div>
              <strong>
                {arquivo
                  ? arquivo.name
                  : "Selecionar arquivo OTDR"}
              </strong>

              <span>
                SOR, PDF, PNG, JPG ou JPEG
              </span>
            </div>
          </label>

          {erro && (
            <div className="otdr-form-erro">
              {erro}
            </div>
          )}

          <div className="otdr-modal-acoes">
            <button
              type="button"
              className="botao-cancelar"
              onClick={aoFechar}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="botao-salvar-otdr"
            >
              <Save size={17} />
              Salvar curva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OtdrModal;