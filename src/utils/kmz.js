import JSZip from 'jszip';

const MAX_POINTS_PER_GEOMETRY = 12000;

function elementsByLocalName(root, localName) {
  return Array.from(root.getElementsByTagName('*')).filter(
    element => element.localName === localName || element.nodeName.split(':').pop() === localName
  );
}

function firstDescendant(root, localName) {
  return elementsByLocalName(root, localName)[0] || null;
}

function textOf(root, localName) {
  return firstDescendant(root, localName)?.textContent?.trim() || '';
}

function reducePoints(points, max = MAX_POINTS_PER_GEOMETRY) {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  const reduced = points.filter((_, index) => index % step === 0);
  const last = points[points.length - 1];
  if (reduced[reduced.length - 1] !== last) reduced.push(last);
  return reduced;
}

function parseCoordinates(text = '') {
  const points = text
    .trim()
    .split(/\s+/)
    .map(item => item.split(',').map(value => Number(value)))
    .filter(parts => parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]))
    .map(([lng, lat, alt = 0]) => [lat, lng, alt]);
  return reducePoints(points);
}

function parseGxTrack(trackNode) {
  const points = elementsByLocalName(trackNode, 'coord')
    .map(node => node.textContent.trim().split(/\s+/).map(Number))
    .filter(parts => parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]))
    .map(([lng, lat, alt = 0]) => [lat, lng, alt]);
  return reducePoints(points);
}

function cleanHtml(text = '') {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function classifyElement(name = '', description = '', folder = '', isLine = false) {
  const value = `${name} ${cleanHtml(description)} ${folder}`.toLowerCase();
  if (/\bcto\b|caixa terminal|terminal optica|terminal óptica/.test(value)) return 'cto';
  if (/splitter|spliter/.test(value)) return 'splitter';
  if (/\bpop\b|olt|central|headend/.test(value)) return 'pop';
  if (/\bceo\b|caixa de emenda|emenda optica|emenda óptica/.test(value)) return 'ceo';
  if (/poste|postes/.test(value)) return 'poste';
  if (/cliente|assinante|onu|ont/.test(value)) return 'cliente';
  if (/rompimento|falha|defeito/.test(value)) return 'rompimento';
  if (isLine && /drop|deriva|ramal/.test(value)) return 'drop';
  if (isLine && /primari|alimentador|feeder|backbone/.test(value)) return 'primario';
  if (isLine && /secundari|distribui|ftth|cabo/.test(value)) return 'distribuicao';
  return isLine ? 'cabo' : 'ponto';
}

function ancestorFolderNames(node) {
  const names = [];
  let current = node.parentElement;
  while (current) {
    const local = current.localName || current.nodeName.split(':').pop();
    if (local === 'Folder' || local === 'Document') {
      const ownName = Array.from(current.children || []).find(child => (child.localName || child.nodeName.split(':').pop()) === 'name');
      if (ownName?.textContent?.trim()) names.unshift(ownName.textContent.trim());
    }
    current = current.parentElement;
  }
  return names.join(' / ');
}

function placemarkInfo(placemark, fallback) {
  const name = textOf(placemark, 'name') || fallback;
  const description = textOf(placemark, 'description') || '';
  const folder = ancestorFolderNames(placemark);
  return { name, description, folder };
}

export function parseKmlText(kmlText) {
  const xml = new DOMParser().parseFromString(kmlText, 'application/xml');
  if (elementsByLocalName(xml, 'parsererror').length) throw new Error('O KML dentro do arquivo está inválido.');

  const tracks = [];
  const markers = [];
  const placemarks = elementsByLocalName(xml, 'Placemark');

  placemarks.forEach((placemark, placemarkIndex) => {
    const info = placemarkInfo(placemark, `Elemento ${placemarkIndex + 1}`);

    elementsByLocalName(placemark, 'LineString').forEach((lineNode, lineIndex) => {
      const points = parseCoordinates(firstDescendant(lineNode, 'coordinates')?.textContent || '');
      if (points.length > 1) tracks.push({
        id: `linha-${placemarkIndex + 1}-${lineIndex + 1}`,
        ...info,
        kind: classifyElement(info.name, info.description, info.folder, true),
        points
      });
    });

    elementsByLocalName(placemark, 'LinearRing').forEach((ringNode, ringIndex) => {
      const points = parseCoordinates(firstDescendant(ringNode, 'coordinates')?.textContent || '');
      if (points.length > 1) tracks.push({
        id: `anel-${placemarkIndex + 1}-${ringIndex + 1}`,
        ...info,
        kind: classifyElement(info.name, info.description, info.folder, true),
        points
      });
    });

    elementsByLocalName(placemark, 'Track').forEach((trackNode, trackIndex) => {
      const points = parseGxTrack(trackNode);
      if (points.length > 1) tracks.push({
        id: `gx-track-${placemarkIndex + 1}-${trackIndex + 1}`,
        ...info,
        kind: classifyElement(info.name, info.description, info.folder, true),
        points
      });
    });

    elementsByLocalName(placemark, 'Point').forEach((pointNode, pointIndex) => {
      const points = parseCoordinates(firstDescendant(pointNode, 'coordinates')?.textContent || '');
      if (points.length) markers.push({
        id: `ponto-${placemarkIndex + 1}-${pointIndex + 1}`,
        ...info,
        kind: classifyElement(info.name, info.description, info.folder, false),
        position: points[0]
      });
    });
  });

  if (!tracks.length) {
    elementsByLocalName(xml, 'LineString').forEach((lineNode, index) => {
      const points = parseCoordinates(firstDescendant(lineNode, 'coordinates')?.textContent || '');
      if (points.length > 1) tracks.push({ id: `linha-global-${index + 1}`, name: `Trecho ${index + 1}`, kind: 'cabo', points });
    });
    elementsByLocalName(xml, 'Track').forEach((trackNode, index) => {
      const points = parseGxTrack(trackNode);
      if (points.length > 1) tracks.push({ id: `track-global-${index + 1}`, name: `Trajeto ${index + 1}`, kind: 'cabo', points });
    });
  }

  if (!markers.length) {
    elementsByLocalName(xml, 'Point').forEach((pointNode, index) => {
      const points = parseCoordinates(firstDescendant(pointNode, 'coordinates')?.textContent || '');
      if (points.length) markers.push({ id: `ponto-global-${index + 1}`, name: `Ponto ${index + 1}`, kind: 'ponto', position: points[0] });
    });
  }

  if (!tracks.length && !markers.length) throw new Error('O KMZ/KML foi aberto, mas não contém linhas, trajetos ou pontos compatíveis.');

  const summary = markers.reduce((acc, item) => {
    acc[item.kind] = (acc[item.kind] || 0) + 1;
    return acc;
  }, {});

  return { tracks, markers, summary };
}

async function extractKmlFromKmz(file) {
  let zip;
  try { zip = await JSZip.loadAsync(await file.arrayBuffer()); }
  catch { throw new Error('O arquivo KMZ está inválido, protegido ou corrompido.'); }

  const kmlEntries = Object.values(zip.files).filter(entry => !entry.dir && entry.name.toLowerCase().endsWith('.kml'));
  if (!kmlEntries.length) throw new Error('Nenhum arquivo KML foi encontrado dentro do KMZ.');
  const preferred = kmlEntries.find(entry => /(^|\/)doc\.kml$/i.test(entry.name)) || kmlEntries[0];
  return preferred.async('string');
}

export async function parseMapFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.kml')) return parseKmlText(await file.text());
  if (name.endsWith('.kmz')) return parseKmlText(await extractKmlFromKmz(file));
  throw new Error('Selecione um arquivo com extensão .KMZ ou .KML.');
}
