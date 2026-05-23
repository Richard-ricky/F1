import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  'pk.eyJ1Ijoicmlja3k4OTA5IiwiYSI6ImNtb3FoMmhhazByejgycXNldmUzaTF4MHMifQ.oO6Cu2k3S7eBBr91ZqbcNA';

// Same 56-point accurate COTA track used by all map variants
const COTA_TRACK: [number, number][] = [
  [-97.63580, 30.13380], [-97.63650, 30.13405], [-97.63720, 30.13430],
  [-97.63790, 30.13455], [-97.63855, 30.13478],
  [-97.63920, 30.13510], [-97.63970, 30.13548], [-97.63995, 30.13590],
  [-97.63985, 30.13635], [-97.63960, 30.13670],
  [-97.63920, 30.13695], [-97.63870, 30.13705], [-97.63820, 30.13695],
  [-97.63780, 30.13670],
  [-97.63750, 30.13640], [-97.63735, 30.13605], [-97.63740, 30.13565],
  [-97.63760, 30.13535],
  [-97.63790, 30.13510], [-97.63830, 30.13495], [-97.63870, 30.13490],
  [-97.63910, 30.13480], [-97.63950, 30.13462], [-97.63980, 30.13435],
  [-97.63990, 30.13400], [-97.63975, 30.13365], [-97.63945, 30.13340],
  [-97.63905, 30.13325],
  [-97.63860, 30.13315], [-97.63810, 30.13310], [-97.63760, 30.13312],
  [-97.63715, 30.13318], [-97.63680, 30.13335], [-97.63660, 30.13362],
  [-97.63658, 30.13398], [-97.63670, 30.13432],
  [-97.63695, 30.13458], [-97.63712, 30.13488], [-97.63708, 30.13518],
  [-97.63692, 30.13542], [-97.63668, 30.13558], [-97.63638, 30.13562],
  [-97.63608, 30.13555],
  [-97.63578, 30.13540], [-97.63548, 30.13520], [-97.63520, 30.13495],
  [-97.63500, 30.13465], [-97.63495, 30.13432], [-97.63505, 30.13400],
  [-97.63525, 30.13375], [-97.63555, 30.13358],
  [-97.63590, 30.13348], [-97.63610, 30.13355], [-97.63620, 30.13368],
  [-97.63612, 30.13380], [-97.63600, 30.13380], [-97.63580, 30.13380],
];

const SECTORS: { coords: [number, number]; label: string }[] = [
  { coords: [-97.63920, 30.13510], label: 'S1' },
  { coords: [-97.63990, 30.13400], label: 'S2' },
  { coords: [-97.63505, 30.13400], label: 'S3' },
];

interface Driver {
  id: string;
  name: string;
  abbreviation: string;
  team: string;
  color: string;
  position: number;
  lat: number;
  lng: number;
}

interface RaceMapProps {
  drivers: Driver[];
  onDriverSelect: (driver: Driver | null) => void;
  selectedDriver: Driver | null;
}

export default function RaceMap({ drivers, onDriverSelect, selectedDriver }: RaceMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map          = useRef<mapboxgl.Map | null>(null);
  const markers      = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-97.63740, 30.13490],
      zoom: 14.8,
      pitch: 52,
      bearing: 17,
      antialias: true,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // 3D terrain
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
        maxzoom: 14,
      });
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.8 });

      // Track
      map.current.addSource('cota-track', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: COTA_TRACK },
        },
      });

      // Glow layers
      map.current.addLayer({
        id: 'track-glow-wide',
        type: 'line',
        source: 'cota-track',
        paint: { 'line-color': '#00ffff', 'line-width': 28, 'line-blur': 20, 'line-opacity': 0.2 },
      });
      map.current.addLayer({
        id: 'track-glow',
        type: 'line',
        source: 'cota-track',
        paint: { 'line-color': '#00ffff', 'line-width': 12, 'line-blur': 6, 'line-opacity': 0.4 },
      });

      // Tarmac
      map.current.addLayer({
        id: 'track-surface',
        type: 'line',
        source: 'cota-track',
        paint: { 'line-color': '#2a2a2a', 'line-width': 11, 'line-opacity': 0.9 },
      });

      // White kerbs
      map.current.addLayer({
        id: 'track-edge-l',
        type: 'line',
        source: 'cota-track',
        paint: { 'line-color': '#ffffff', 'line-width': 1.5, 'line-opacity': 0.5, 'line-offset': 5.5 },
      });
      map.current.addLayer({
        id: 'track-edge-r',
        type: 'line',
        source: 'cota-track',
        paint: { 'line-color': '#ffffff', 'line-width': 1.5, 'line-opacity': 0.5, 'line-offset': -5.5 },
      });

      // Cyan centre
      map.current.addLayer({
        id: 'track-centre',
        type: 'line',
        source: 'cota-track',
        paint: { 'line-color': '#00ffff', 'line-width': 2, 'line-opacity': 0.85 },
      });

      // Sector markers
      SECTORS.forEach(s => {
        const el = document.createElement('div');
        el.innerHTML = `<div style="
          background:rgba(0,255,255,0.15);border:1px solid rgba(0,255,255,0.5);
          color:#00ffff;padding:3px 9px;border-radius:4px;
          font-size:10px;font-weight:800;letter-spacing:0.06em;
          font-family:Inter,sans-serif;backdrop-filter:blur(4px);
        ">${s.label}</div>`;
        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(s.coords)
          .addTo(map.current!);
      });

      // START/FINISH
      const sf = document.createElement('div');
      sf.innerHTML = `<div style="
        background:rgba(255,255,255,0.25);backdrop-filter:blur(8px);
        color:white;padding:4px 10px;border-radius:4px;
        font-size:9px;font-weight:800;border:1px solid rgba(255,255,255,0.6);
        font-family:Inter,sans-serif;
      ">START/FINISH</div>`;
      new mapboxgl.Marker({ element: sf, anchor: 'center' })
        .setLngLat([-97.63720, 30.13442])
        .addTo(map.current!);

      // Circuit badge
      const info = document.createElement('div');
      info.innerHTML = `<div style="
        background:rgba(3,3,3,0.8);backdrop-filter:blur(12px);
        border:1px solid rgba(0,255,255,0.4);border-radius:8px;
        padding:8px 14px;pointer-events:none;
      ">
        <div style="font-size:11px;font-weight:800;color:#00ffff;letter-spacing:0.07em;font-family:Inter,sans-serif;">
          CIRCUIT OF THE AMERICAS
        </div>
        <div style="font-size:9px;color:rgba(255,255,255,0.5);margin-top:2px;font-family:Inter,sans-serif;">
          Austin, Texas · 5.513 km · 20 Turns
        </div>
      </div>`;
      new mapboxgl.Marker({ element: info, anchor: 'top-left' })
        .setLngLat([-97.64060, 30.13680])
        .addTo(map.current!);
    });

    return () => {
      markers.current.forEach(m => m.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current?.loaded()) return;

    drivers.forEach(driver => {
      const isSelected = selectedDriver?.id === driver.id;
      let marker = markers.current.get(driver.id);

      if (!marker) {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 900; font-family: Inter, sans-serif;
          background: ${driver.color};
          color: ${driver.position <= 3 ? '#000' : '#fff'};
          border: 2px solid ${isSelected ? '#00ffff' : 'rgba(255,255,255,0.4)'};
          box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 16px ${driver.color}40;
          transition: all 2s cubic-bezier(0.4,0,0.2,1);
        `;
        el.textContent = driver.abbreviation;
        el.onclick = () => onDriverSelect(isSelected ? null : driver);

        marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([driver.lng, driver.lat])
          .addTo(map.current!);
        markers.current.set(driver.id, marker);
      } else {
        marker.setLngLat([driver.lng, driver.lat]);
        const el = marker.getElement();
        el.style.borderColor = isSelected ? '#00ffff' : 'rgba(255,255,255,0.4)';
        el.style.borderWidth  = isSelected ? '3px' : '2px';
        el.style.boxShadow    = isSelected
          ? `0 0 20px #00ffff, 0 4px 12px rgba(0,0,0,0.6)`
          : `0 4px 12px rgba(0,0,0,0.6), 0 0 16px ${driver.color}40`;
      }
    });

    const ids = new Set(drivers.map(d => d.id));
    markers.current.forEach((m, id) => {
      if (!ids.has(id)) { m.remove(); markers.current.delete(id); }
    });
  }, [drivers, selectedDriver, onDriverSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
    </div>
  );
}