import { useState } from 'react';
import { LockKeyhole, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginModal({ onClose }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err?.message?.includes('invalid-credential')
        ? 'E-mail ou senha incorretos.'
        : (err?.message || 'Não foi possível entrar.'));
    } finally {
      setSaving(false);
    }
  }

  return <div className="admin-backdrop" onMouseDown={onClose}>
    <div className="admin-modal" onMouseDown={e => e.stopPropagation()}>
      <button className="admin-close" onClick={onClose} aria-label="Fechar"><X size={20}/></button>
      <div className="admin-icon"><LockKeyhole size={28}/></div>
      <h2>Administração</h2>
      <p>Entre com o usuário administrador cadastrado no Firebase.</p>
      <form onSubmit={submit}>
        <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus /></label>
        <label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        {error && <div className="admin-error">{error}</div>}
        <button className="admin-submit" disabled={saving}>{saving ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  </div>;
}
