import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Trash2, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { lerDados, salvarDados, novoId } from '../utils/localData';
import './CrudModule.css';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CrudModule({ titulo, subtitulo, storageKey, fields, cardTitle='nome', cardSubtitle='rota', badgeField='status', icon: Icon }) {
  const [params] = useSearchParams();
  const initial = () => Object.fromEntries(fields.map(f => [f.name, params.get(f.name) || f.defaultValue || '']));
  const [items, setItems] = useState(() => lerDados(storageKey));
  const [form, setForm] = useState(initial);
  const [show, setShow] = useState(false);
  const [q, setQ] = useState('');
  const filtrados = useMemo(() => items.filter(i => JSON.stringify(i).toLowerCase().includes(q.toLowerCase())), [items, q]);

  async function save(e) {
    e.preventDefault();
    const required = fields.find(f => f.required && !String(form[f.name] || '').trim());
    if (required) return alert(`Informe ${required.label}.`);
    const prepared = { ...form };
    for (const field of fields.filter(f => f.type === 'file')) {
      const file = form[field.name];
      if (file instanceof File) {
        if (file.size > 2.5 * 1024 * 1024) return alert('A foto deve ter no máximo 2,5 MB.');
        prepared[field.name] = await fileToDataUrl(file);
        prepared[`${field.name}Nome`] = file.name;
      }
    }
    const next = [{ ...prepared, id: novoId(storageKey), criadoEm: new Date().toISOString() }, ...items];
    setItems(next);
    salvarDados(storageKey, next);
    setForm(initial());
    setShow(false);
  }

  function remove(id) {
    if (!confirm('Excluir este registro?')) return;
    const next = items.filter(i => i.id !== id);
    setItems(next);
    salvarDados(storageKey, next);
  }

  return <div className="modulo-page">
    <header className="modulo-header"><div><span className="pagina-identificacao">NORTH TECNOLOGIA</span><h1>{titulo}</h1><p>{subtitulo}</p></div><button className="botao-primario" onClick={() => setShow(true)}><Plus size={17}/> Novo cadastro</button></header>
    <div className="modulo-toolbar"><Search size={18}/><input placeholder={`Pesquisar em ${titulo}...`} value={q} onChange={e => setQ(e.target.value)}/><span>{filtrados.length} registro(s)</span></div>
    {filtrados.length === 0 ? <div className="modulo-empty">{Icon && <Icon size={38}/>}<h3>Nenhum registro encontrado</h3><p>Use o botão “Novo cadastro” para começar.</p></div> : <div className="modulo-grid">{filtrados.map(item => <article className="modulo-card" key={item.id}>{item.foto && <img className="modulo-card-foto" src={item.foto} alt={item[cardTitle] || titulo}/>}<div className="modulo-card-top"><div className="modulo-card-icon">{Icon && <Icon size={22}/>}</div><span className="modulo-badge">{item[badgeField] || 'Cadastrado'}</span></div><h2>{item[cardTitle] || 'Sem nome'}</h2><p>{item[cardSubtitle] || 'Sem informação complementar'}</p><div className="modulo-details">{fields.slice(0, 7).filter(f => f.type !== 'file' && item[f.name]).map(f => <div key={f.name}><strong>{f.label}</strong><span>{item[f.name]}</span></div>)}</div><div className="modulo-actions"><button onClick={() => alert('Os detalhes deste cadastro estão disponíveis no cartão.')}><ArrowRight size={16}/> Detalhes</button><button className="danger" onClick={() => remove(item.id)}><Trash2 size={16}/></button></div></article>)}</div>}
    {show && <div className="modal-backdrop" onMouseDown={() => setShow(false)}><div className="crud-modal" onMouseDown={e => e.stopPropagation()}><div className="crud-modal-head"><h2>Novo cadastro — {titulo}</h2><button onClick={() => setShow(false)}>×</button></div><form onSubmit={save} className="crud-form">{fields.map(f => <label className={f.full ? 'full' : ''} key={f.name}><span>{f.label}{f.required ? ' *' : ''}</span>{f.type === 'textarea' ? <textarea value={form[f.name]} onChange={e => setForm({...form, [f.name]: e.target.value})}/> : f.type === 'select' ? <select value={form[f.name]} onChange={e => setForm({...form, [f.name]: e.target.value})}>{f.options.map(o => <option key={o}>{o}</option>)}</select> : f.type === 'file' ? <div className="file-field"><input type="file" accept={f.accept || 'image/*'} onChange={e => setForm({...form, [f.name]: e.target.files?.[0] || ''})}/><small><ImageIcon size={14}/> {form[f.name]?.name || 'Nenhum arquivo selecionado'}</small></div> : <input type={f.type || 'text'} value={form[f.name]} onChange={e => setForm({...form, [f.name]: e.target.value})}/>}</label>)}<div className="crud-buttons full"><button type="button" className="botao-secundario" onClick={() => setShow(false)}>Cancelar</button><button className="botao-primario">Salvar cadastro</button></div></form></div></div>}
  </div>
}
