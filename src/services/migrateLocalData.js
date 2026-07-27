import { createRecord } from './firestoreCrud';

const MAPPINGS = [
  ['fibrapro-darkfiber', 'darkFiber'],
  ['fibrapro-clientes', 'clientesDedicados'],
  ['fibrapro-ftth-redes', 'ftthRedes'],
  ['fibrapro-cabos', 'cabos'],
  ['fibrapro-fusoes', 'fusoes'],
  ['fibrapro-arquivos-meta', 'arquivos']
];

export async function migrateLocalData() {
  const result = [];
  for (const [localKey, collectionName] of MAPPINGS) {
    let records = [];
    try { records = JSON.parse(localStorage.getItem(localKey) || '[]'); }
    catch { records = []; }
    let count = 0;
    for (const record of records) {
      const { id, criadoEm, ...data } = record;
      await createRecord(collectionName, { ...data, migradoDoLocal: true, idLocalAnterior: id || '' });
      count++;
    }
    result.push({ localKey, collectionName, count });
  }
  localStorage.setItem('fibrapro-cloud-migration-complete', new Date().toISOString());
  return result;
}
