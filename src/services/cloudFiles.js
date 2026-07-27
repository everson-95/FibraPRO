import { createRecord, deleteRecord, observeCollection } from './firestoreCrud';

const COLLECTION = 'anexos';
const MAX_CLOUD_BYTES = 650 * 1024;

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function saveCloudAttachment({ parentType, parentId, category, file, extra = {} }) {
  const canStoreOriginal = file.size <= MAX_CLOUD_BYTES;
  const dataUrl = canStoreOriginal ? await fileToDataUrl(file) : '';
  const reference = await createRecord(COLLECTION, {
    parentType,
    parentId,
    category,
    nome: file.name,
    tipo: file.type || '',
    tamanho: file.size,
    dataUrl,
    originalDisponivel: canStoreOriginal,
    ...extra
  });
  return { id: reference.id, parentType, parentId, category, nome: file.name, tipo: file.type || '', tamanho: file.size, dataUrl, originalDisponivel: canStoreOriginal, ...extra };
}

export function observeCloudAttachments(parentType, parentId, category, callback, onError) {
  return observeCollection(COLLECTION, callback, onError, {
    where: [['parentType', '==', parentType], ['parentId', '==', parentId], ['category', '==', category]]
  });
}

export async function deleteCloudAttachment(id) {
  return deleteRecord(COLLECTION, id);
}

export function downloadDataUrl(dataUrl, filename = 'arquivo') {
  if (!dataUrl) {
    alert('O mapa está salvo na nuvem, mas o arquivo original era grande demais para o plano gratuito do Firestore.');
    return;
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
