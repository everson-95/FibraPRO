import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, FeatureGroup, LayerGroup, LayersControl, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import './MapaRota.css';

const POINT_STYLES = {
  cto: { label: 'CTOs', color: '#16a34a', background: '#dcfce7', glyph: 'C' },
  splitter: { label: 'Splitters', color: '#9333ea', background: '#f3e8ff', glyph: 'S' },
  pop: { label: 'POPs / OLTs', color: '#ea580c', background: '#ffedd5', glyph: 'P' },
  ceo: { label: 'CEOs', color: '#0891b2', background: '#cffafe', glyph: 'E' },
  poste: { label: 'Postes', color: '#475569', background: '#e2e8f0', glyph: '│' },
  cliente: { label: 'Clientes', color: '#2563eb', background: '#dbeafe', glyph: '⌂' },
  rompimento: { label: 'Rompimentos', color: '#dc2626', background: '#fee2e2', glyph: '!' },
  ponto: { label: 'Outros pontos', color: '#64748b', background: '#f1f5f9', glyph: '•' }
};

const LINE_STYLES = {
  primario: { label: 'Cabos primários', color: '#f97316', weight: 5 },
  distribuicao: { label: 'Cabos de distribuição', color: '#2563eb', weight: 4 },
  drop: { label: 'Drops / ramais', color: '#94a3b8', weight: 2 },
  cabo: { label: 'Outros cabos', color: '#0ea5e9', weight: 3 }
};

function validPoint(point) {
  return Array.isArray(point) && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1]));
}

function FitMap({ positions, fitToken }) {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    if (positions.length === 1) map.setView(positions[0], 17);
    else map.fitBounds(L.latLngBounds(positions), { padding: [36, 36], maxZoom: 18 });
  }, [map, positions, fitToken]);
  return null;
}

function LocationFollower({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView(location, 18, { animate: true });
  }, [map, location]);
  return null;
}

function markerIcon(kind) {
  const style = POINT_STYLES[kind] || POINT_STYLES.ponto;
  return L.divIcon({
    className: 'fibrapro-map-icon-wrap',
    html: `<span class="fibrapro-map-icon" style="--icon-color:${style.color};--icon-bg:${style.background}">${style.glyph}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14]
  });
}

function PointPopup({ point }) {
  const [lat, lng] = point.position;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return <div className="map-popup"><strong>{point.name || point.label || 'Ponto'}</strong>{point.folder && <small>{point.folder}</small>}{point.description && <p>{String(point.description).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}</p>}<a href={mapsUrl} target="_blank" rel="noreferrer">Navegar até aqui</a></div>;
}

export default function MapaRota({ center = [-17.868488, -42.026878], zoom = 12, points = [], tracks = [], height = 560, enableLocation = true, showLayerControl = true }) {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locating, setLocating] = useState(false);
  const [fitToken, setFitToken] = useState(0);

  const validPoints = useMemo(() => points.filter(p => validPoint(p.position)).map(p => ({ ...p, position: [Number(p.position[0]), Number(p.position[1])], kind: p.kind || 'ponto' })), [points]);
  const validTracks = useMemo(() => tracks.map(track => ({ ...track, kind: track.kind || 'cabo', points: (track.points || []).filter(validPoint).map(p => [Number(p[0]), Number(p[1])]) })).filter(track => track.points.length > 1), [tracks]);
  const allPositions = useMemo(() => [...validPoints.map(p => p.position), ...validTracks.flatMap(t => t.points)], [validPoints, validTracks]);
  const mapCenter = allPositions[0] || center;

  const pointGroups = useMemo(() => Object.entries(POINT_STYLES).map(([kind, style]) => ({ kind, style, items: validPoints.filter(p => p.kind === kind) })).filter(group => group.items.length), [validPoints]);
  const trackGroups = useMemo(() => Object.entries(LINE_STYLES).map(([kind, style]) => ({ kind, style, items: validTracks.filter(t => t.kind === kind) })).filter(group => group.items.length), [validTracks]);

  function locate() {
    if (!navigator.geolocation) return setLocationError('Localização não disponível neste navegador.');
    setLocating(true); setLocationError('');
    navigator.geolocation.getCurrentPosition(
      pos => { setLocation([pos.coords.latitude, pos.coords.longitude]); setLocating(false); },
      err => { setLocationError(err.code === 1 ? 'Permita o acesso à localização no navegador.' : 'Não foi possível obter sua localização.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  const renderTrackGroup = group => <FeatureGroup key={group.kind}>{group.items.map((track, index) => <Polyline key={track.id || index} positions={track.points} pathOptions={{ color: group.style.color, weight: group.style.weight, opacity: .9 }}><Popup><div className="map-popup"><strong>{track.name || group.style.label}</strong>{track.folder && <small>{track.folder}</small>}{track.description && <p>{String(track.description).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}</p>}</div></Popup></Polyline>)}</FeatureGroup>;
  const renderPointGroup = group => <FeatureGroup key={group.kind}>{group.items.map((point, index) => <Marker key={point.id || `${point.name}-${index}`} position={point.position} icon={markerIcon(group.kind)}><Popup><PointPopup point={point} /></Popup></Marker>)}</FeatureGroup>;

  return <div className="fibrapro-map-shell">
    <MapContainer center={mapCenter} zoom={zoom} style={{ height: `${height}px`, width: '100%', borderRadius: '14px' }} zoomControl>
      {showLayerControl ? <LayersControl position="topright" collapsed={false}>
        <LayersControl.BaseLayer checked name="Mapa"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satélite"><TileLayer attribution='Tiles &copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /></LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Híbrido"><LayerGroup><TileLayer attribution='Tiles &copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /><TileLayer attribution='Labels &copy; Esri' url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" /></LayerGroup></LayersControl.BaseLayer>
        {trackGroups.map(group => <LayersControl.Overlay checked name={`${group.style.label} (${group.items.length})`} key={`line-${group.kind}`}>{renderTrackGroup(group)}</LayersControl.Overlay>)}
        {pointGroups.map(group => <LayersControl.Overlay checked={group.kind !== 'poste' && group.kind !== 'cliente'} name={`${group.style.label} (${group.items.length})`} key={`point-${group.kind}`}>{renderPointGroup(group)}</LayersControl.Overlay>)}
      </LayersControl> : <><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{trackGroups.map(renderTrackGroup)}{pointGroups.map(renderPointGroup)}</>}
      <FitMap positions={allPositions} fitToken={fitToken} />
      <LocationFollower location={location} />
      {location && <><CircleMarker center={location} radius={10} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}><Popup><strong>Você está aqui</strong></Popup></CircleMarker><CircleMarker center={location} radius={24} pathOptions={{ stroke: false, fillColor: '#3b82f6', fillOpacity: .18 }} /></>}
    </MapContainer>
    <div className="fibrapro-map-tools">
      {enableLocation && <button type="button" onClick={locate} title="Minha localização"><LocateFixed size={18}/><span>{locating ? 'Localizando...' : 'Minha localização'}</span></button>}
      <button type="button" onClick={() => setFitToken(v => v + 1)} title="Enquadrar toda a rede"><Crosshair size={18}/><span>Enquadrar rede</span></button>
    </div>
    {locationError && <div className="fibrapro-map-message">{locationError}</div>}
  </div>;
}
