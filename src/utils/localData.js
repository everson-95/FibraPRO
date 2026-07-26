export function lerDados(chave) {
  try { return JSON.parse(localStorage.getItem(chave)) || []; } catch { return []; }
}
export function salvarDados(chave, dados) { localStorage.setItem(chave, JSON.stringify(dados)); }
export function novoId(prefix='item') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
