import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Cable,
  ChevronDown,
  ChevronRight,
  Folder,
  MapPin,
  Plus,
  Search,
  Trash2
} from 'lucide-react';

import {
  excluirDarkFiber,
  listarDarkFiber,
  salvarDarkFiber
} from '../services/darkFiber';

import './Backbone.css';
import './DarkFiber.css';

const vazio = {
  cliente: '',
  rota: '',
  fibras: '',
  origem: '',
  destino: '',
  latOrigem: '',
  lngOrigem: '',
  latDestino: '',
  lngDestino: '',
  cabo: '',
  status: 'Em uso',
  observacao: ''
};

function normalizarCliente(valor) {
  return String(valor || '')
    .trim()
    .replace(/\s+/g, ' ');
}

export default function DarkFiber() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vazio);
  const [openGroups, setOpenGroups] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    try {
      const dados = await listarDarkFiber();
      setItems(dados);
    } catch (erro) {
      console.error('Erro ao carregar Dark Fiber:', erro);
      alert(
        'Não foi possível carregar os circuitos do Firebase. ' +
        'Verifique a internet e as regras do Firestore.'
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();

    if (!termo) return items;

    return items.filter(item =>
      `${item.cliente || ''} ${item.rota || ''} ${item.fibras || ''} ` +
      `${item.origem || ''} ${item.destino || ''} ${item.cabo || ''} ` +
      `${item.status || ''}`
        .toLowerCase()
        .includes(termo)
    );
  }, [items, q]);

  const grupos = useMemo(() => {
    const agrupados = {};

    filtrados.forEach(item => {
      const nome = normalizarCliente(item.cliente) || 'Sem cliente';

      if (!agrupados[nome]) {
        agrupados[nome] = [];
      }

      agrupados[nome].push(item);
    });

    return Object.entries(agrupados).sort(([a], [b]) =>
      a.localeCompare(b, 'pt-BR')
    );
  }, [filtrados]);

  async function salvar(evento) {
    evento.preventDefault();

    const cliente = normalizarCliente(form.cliente);
    const rota = String(form.rota || '').trim();

    if (!cliente) {
      alert('Informe o cliente.');
      return;
    }

    if (!rota) {
      alert('Informe a rota.');
      return;
    }

    setSalvando(true);

    try {
      await salvarDarkFiber({
        ...form,
        cliente,
        rota
      });

      await carregar();

      setOpenGroups(atual => ({
        ...atual,
        [cliente]: true
      }));

      setForm(vazio);
      setModal(false);
    } catch (erro) {
      console.error('Erro ao salvar Dark Fiber:', erro);
      alert(
        `Não foi possível salvar o circuito no Firebase.\n\n` +
        `${erro?.message || erro}`
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este circuito Dark Fiber?')) {
      return;
    }

    try {
      await excluirDarkFiber(id);
      await carregar();
    } catch (erro) {
      console.error('Erro ao excluir Dark Fiber:', erro);
      alert(
        `Não foi possível excluir o circuito.\n\n` +
        `${erro?.message || erro}`
      );
    }
  }

  function toggle(nome) {
    setOpenGroups(atual => ({
      ...atual,
      [nome]: atual[nome] === false
    }));
  }

  function atualizarCampo(campo, valor) {
    setForm(atual => ({
      ...atual,
      [campo]: valor
    }));
  }

  return (
    <div className="backbone-page">
      <div className="backbone-cabecalho">
        <div>
          <span className="pagina-identificacao">
            Infraestrutura óptica
          </span>

          <h1>Dark Fiber</h1>

          <p>
            Clientes organizados em pastas, com todas as rotas e
            circuitos separados.
          </p>
        </div>

        <button
          className="botao-nova-rota"
          type="button"
          onClick={() => setModal(true)}
        >
          <Plus size={18} />
          Novo circuito
        </button>
      </div>

      <div className="dark-search">
        <Search size={18} />

        <input
          placeholder="Pesquisar cliente, rota, fibra, origem ou destino..."
          value={q}
          onChange={evento => setQ(evento.target.value)}
        />

        <span>{filtrados.length} circuito(s)</span>
      </div>

      {carregando ? (
        <div className="dark-empty">
          <Cable size={42} />
          <h3>Carregando circuitos...</h3>
          <p>Buscando os dados no Firebase.</p>
        </div>
      ) : grupos.length === 0 ? (
        <div className="dark-empty">
          <Cable size={42} />
          <h3>Nenhum circuito cadastrado</h3>
          <p>Cadastre a primeira Dark Fiber para começar.</p>
        </div>
      ) : (
        <div className="dark-company-list">
          {grupos.map(([cliente, circuitos]) => {
            const aberto = openGroups[cliente] !== false;

            return (
              <section
                className="dark-company"
                key={cliente}
              >
                <button
                  className="dark-company-header"
                  type="button"
                  onClick={() => toggle(cliente)}
                >
                  <span className="dark-company-icon">
                    <Folder size={21} />
                  </span>

                  <span className="dark-company-title">
                    <strong>{cliente}</strong>
                    <small>
                      {circuitos.length} rota(s) cadastrada(s)
                    </small>
                  </span>

                  {aberto ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>

                {aberto && (
                  <div className="backbone-grid dark-company-grid">
                    {circuitos.map(item => (
                      <article
                        className="rota-card dark-backbone-card"
                        key={item.id}
                      >
                        <div className="rota-card-topo">
                          <div className="rota-icone">
                            <Cable size={23} />
                          </div>

                          <span
                            className={`status-rota ${
                              item.status === 'Em uso'
                                ? 'status-operacional'
                                : 'status-cadastro'
                            }`}
                          >
                            {item.status || 'Em uso'}
                          </span>
                        </div>

                        <h2>{item.rota}</h2>

                        <p className="nome-completo">
                          {item.origem || 'Origem'}
                          {' ↔ '}
                          {item.destino || 'Destino'}
                        </p>

                        <div className="rota-informacoes">
                          <div>
                            <MapPin size={17} />
                            <span>
                              <strong>Origem:</strong>{' '}
                              {item.origem || 'Não informada'}
                            </span>
                          </div>

                          <div>
                            <MapPin size={17} />
                            <span>
                              <strong>Destino:</strong>{' '}
                              {item.destino || 'Não informado'}
                            </span>
                          </div>

                          <div>
                            <Cable size={17} />
                            <span>
                              <strong>Fibras:</strong>{' '}
                              {item.fibras || 'Não informadas'}
                            </span>
                          </div>

                          <div>
                            <Cable size={17} />
                            <span>
                              <strong>Cabo:</strong>{' '}
                              {item.cabo || 'Não informado'}
                            </span>
                          </div>
                        </div>

                        <div className="dark-card-footer">
                          <Link
                            className="botao-abrir-rota"
                            to={`/darkfiber/${item.id}`}
                          >
                            Abrir circuito
                            <ArrowRight size={18} />
                          </Link>

                          <button
                            className="dark-delete"
                            type="button"
                            title="Excluir circuito"
                            onClick={() => excluir(item.id)}
                          >
                            <Trash2 size={19} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={() => {
            if (!salvando) setModal(false);
          }}
        >
          <div
            className="crud-modal"
            onMouseDown={evento => evento.stopPropagation()}
          >
            <div className="crud-modal-head">
              <h2>Novo circuito Dark Fiber</h2>

              <button
                type="button"
                onClick={() => setModal(false)}
                disabled={salvando}
              >
                ×
              </button>
            </div>

            <form
              className="crud-form"
              onSubmit={salvar}
            >
              <label>
                <span>Cliente / pasta *</span>

                <input
                  value={form.cliente}
                  onChange={evento =>
                    atualizarCampo('cliente', evento.target.value)
                  }
                  placeholder="Ex.: TIM S.A."
                  required
                />
              </label>

              <label>
                <span>Rota *</span>

                <input
                  value={form.rota}
                  onChange={evento =>
                    atualizarCampo('rota', evento.target.value)
                  }
                  placeholder="Ex.: MCH ↔ PTE"
                  required
                />
              </label>

              <label>
                <span>Fibras utilizadas</span>

                <input
                  value={form.fibras}
                  onChange={evento =>
                    atualizarCampo('fibras', evento.target.value)
                  }
                  placeholder="Ex.: FO 11 e 12"
                />
              </label>

              <label>
                <span>Cabo</span>

                <input
                  value={form.cabo}
                  onChange={evento =>
                    atualizarCampo('cabo', evento.target.value)
                  }
                />
              </label>

              <label>
                <span>Origem</span>

                <input
                  value={form.origem}
                  onChange={evento =>
                    atualizarCampo('origem', evento.target.value)
                  }
                />
              </label>

              <label>
                <span>Destino</span>

                <input
                  value={form.destino}
                  onChange={evento =>
                    atualizarCampo('destino', evento.target.value)
                  }
                />
              </label>

              <label>
                <span>Latitude da origem</span>

                <input
                  value={form.latOrigem}
                  onChange={evento =>
                    atualizarCampo('latOrigem', evento.target.value)
                  }
                  placeholder="-17.000000"
                />
              </label>

              <label>
                <span>Longitude da origem</span>

                <input
                  value={form.lngOrigem}
                  onChange={evento =>
                    atualizarCampo('lngOrigem', evento.target.value)
                  }
                  placeholder="-42.000000"
                />
              </label>

              <label>
                <span>Latitude do destino</span>

                <input
                  value={form.latDestino}
                  onChange={evento =>
                    atualizarCampo('latDestino', evento.target.value)
                  }
                  placeholder="-17.000000"
                />
              </label>

              <label>
                <span>Longitude do destino</span>

                <input
                  value={form.lngDestino}
                  onChange={evento =>
                    atualizarCampo('lngDestino', evento.target.value)
                  }
                  placeholder="-42.000000"
                />
              </label>

              <label>
                <span>Status</span>

                <select
                  value={form.status}
                  onChange={evento =>
                    atualizarCampo('status', evento.target.value)
                  }
                >
                  <option>Em uso</option>
                  <option>Reservada</option>
                  <option>Manutenção</option>
                  <option>Encerrada</option>
                </select>
              </label>

              <label className="full">
                <span>Observações</span>

                <textarea
                  value={form.observacao}
                  onChange={evento =>
                    atualizarCampo('observacao', evento.target.value)
                  }
                />
              </label>

              <div className="crud-buttons full">
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={() => setModal(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="botao-primario"
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : 'Salvar circuito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
