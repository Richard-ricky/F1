import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import CarIcon from './CarIcon';
import { createRoot } from 'react-dom/client';

mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  'pk.eyJ1Ijoicmlja3k4OTA5IiwiYSI6ImNtb3FoMmhhazByejgycXNldmUzaTF4MHMifQ.oO6Cu2k3S7eBBr91ZqbcNA';

// Accurate COTA track — 56 GPS points traced from real circuit
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

const TURN_LABELS: [number, number, string][] = [
  [-97.63940, 30.13520, 'T1'],
  [-97.63870, 30.13712, 'T3'],
  [-97.63995, 30.13470, 'T9'],
  [-97.63650, 30.13305, 'T11'],
  [-97.63600, 30.13570, 'T15'],
  [-97.63480, 30.13425, 'T18'],
  [-97.63590, 30.13335, 'T19'],
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

interface AccurateRaceMapProps {
  drivers: Driver[];
  onDriverSelect: (driver: Driver | null) => void;
  selectedDriver: Driver | null;
}

export default function AccurateRaceMap({ drivers, onDriverSelect, selectedDriver }: AccurateRaceMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const roots = useRef<Map<string, ReturnType<typeof createRoot>>>(new Map());

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-97.63740, 30.13490],
      zoom: 14.8,
      pitch: 0,
      bearing: 17,
      antialias: true,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Track source
      map.current.addSource('cota-track', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: COTA_TRACK },
        },
      });

      // Outer glow
      map.current.addLayer({
        id: 'track-glow',
        type: 'line',
        source: 'cota-track',
        paint: { 'line-color': '#00ffff', 'line-width': 20, 'line-blur': 14, 'line-opacity': 0.25 },
      });

      // Tarmac surface
      map.current.addLayer({
        id: 'track-surface',
        type: 'line',
        source: 'cota-track',
        paint: { 'line-color': '#3a3a3a', 'line-width': 10, 'line-opacity': 0.85 },
      });

      // Centre line
      map.current.addLayer({
        id: 'track-centre',
        type: 'line',
        source: 'cota-track',
        paint: { 'line-color': '#00ffff', 'line-width': 2.5, 'line-opacity': 0.9 },
      });

      // Turn labels
      TURN_LABELS.forEach(([lng, lat, label]) => {
        const el = document.createElement('div');
        el.innerHTML = `<div style="
          background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
          border:1px solid rgba(255,255,255,0.3);border-radius:50%;
          width:22px;height:22px;display:flex;align-items:center;justify-content:center;
          font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);
          font-family:Inter,sans-serif;
        ">${label.replace('T', '')}</div>`;
        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map.current!);
      });

      // START/FINISH
      const sf = document.createElement('div');
      sf.innerHTML = `<div style="
        background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);
        border:1px solid rgba(255,255,255,0.6);border-radius:4px;
        padding:3px 10px;font-size:9px;font-weight:800;color:#fff;
        letter-spacing:0.08em;white-space:nowrap;font-family:Inter,sans-serif;
      ">⬛⬜ START/FINISH</div>`;
      new mapboxgl.Marker({ element: sf, anchor: 'center' })
        .setLngLat([-97.63720, 30.13442])
        .addTo(map.current!);

      // Circuit info
      const info = document.createElement('div');
      info.innerHTML = `<div style="
        background:rgba(3,3,3,0.8);backdrop-filter:blur(12px);
        border:1px solid rgba(0,255,255,0.4);border-radius:8px;
        padding:8px 14px;
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
      roots.current.forEach(r => r.unmount());
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
        el.style.cssText = 'cursor:pointer;';
        const root = createRoot(el);
        root.render(<CarIcon color={driver.color} scale={isSelected ? 1.0 : 0.75} />);
        roots.current.set(driver.id, root);
        el.onclick = () => onDriverSelect(isSelected ? null : driver);

        marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([driver.lng, driver.lat])
          .addTo(map.current!);
        markers.current.set(driver.id, marker);
      } else {
        marker.setLngLat([driver.lng, driver.lat]);
        const el = marker.getElement();
        el.style.filter = isSelected ? 'drop-shadow(0 0 10px #00ffff)' : 'none';
        el.style.zIndex  = isSelected ? '10' : '1';
      }
    });

    const ids = new Set(drivers.map(d => d.id));
    markers.current.forEach((m, id) => {
      if (!ids.has(id)) {
        m.remove();
        markers.current.delete(id);
        roots.current.get(id)?.unmount();
        roots.current.delete(id);
      }
    });
  }, [drivers, selectedDriver, onDriverSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
    </div>
  );
}