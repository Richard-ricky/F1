/**
 * AccurateRaceMap.tsx  —  Satellite + streets map, circuit-aware
 * Replaces the hardcoded COTA version. Reads the correct circuit
 * from useCircuit(location) and redraws on session change.
 */

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createRoot } from 'react-dom/client';
import CarIcon from './CarIcon';
import { useCircuit } from '../hooks/useCircuit';

mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  'pk.eyJ1Ijoicmlja3k4OTA5IiwiYSI6ImNtb3FoMmhhazByejgycXNldmUzaTF4MHMifQ.oO6Cu2k3S7eBBr91ZqbcNA';

interface Driver {
  id: string; name: string; abbreviation: string;
  team: string; color: string; position: number;
  lat: number; lng: number;
}

interface AccurateRaceMapProps {
  drivers:         Driver[];
  onDriverSelect:  (driver: Driver | null) => void;
  selectedDriver:  Driver | null;
  /** Pass sessionInfo?.location from useOpenF1Live() */
  location?:       string | null;
}

export default function AccurateRaceMap({
  drivers, onDriverSelect, selectedDriver, location,
}: AccurateRaceMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map          = useRef<mapboxgl.Map | null>(null);
  const markers      = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const roots        = useRef<Map<string, ReturnType<typeof createRoot>>>(new Map());
  const staticRef    = useRef<mapboxgl.Marker[]>([]);
  const prevKeyRef   = useRef<string>('');

  const circuit = useCircuit(location);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style:     'mapbox://styles/mapbox/satellite-streets-v12',
      center:    circuit.center,
      zoom:      circuit.zoom,
      pitch:     circuit.pitch,
      bearing:   circuit.bearing,
      antialias: true,
    });

    map.current.on('load', () => drawCircuit(map.current!, circuit, staticRef));

    return () => {
      roots.current.forEach(r => r.unmount());
      markers.current.forEach(m => m.remove());
      staticRef.current.forEach(m => m.remove());
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Redraw on circuit change ───────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || prevKeyRef.current === circuit.key) return;
    prevKeyRef.current = circuit.key;

    const redraw = () => {
      staticRef.current.forEach(mk => mk.remove());
      staticRef.current = [];
      markers.current.forEach(mk => mk.remove());
      markers.current.clear();
      roots.current.forEach(r => r.unmount());
      roots.current.clear();

      ['track-glow','track-surface','track-centre'].forEach(id => {
        if (m.getLayer(id)) m.removeLayer(id);
      });
      if (m.getSource('circuit-track')) m.removeSource('circuit-track');

      drawCircuit(m, circuit, staticRef);

      m.flyTo({
        center: circuit.center, zoom: circuit.zoom,
        bearing: circuit.bearing, pitch: circuit.pitch,
        duration: 1200, essential: true,
      });
    };

    if (m.isStyleLoaded()) redraw(); else m.once('load', redraw);
  }, [circuit]);

  // ── Driver markers ────────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m?.loaded()) return;

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
          .setLngLat([driver.lng, driver.lat]).addTo(m);
        markers.current.set(driver.id, marker);
      } else {
        marker.setLngLat([driver.lng, driver.lat]);
        const el = marker.getElement();
        el.style.filter = isSelected ? 'drop-shadow(0 0 10px #00ffff)' : 'none';
        el.style.zIndex  = isSelected ? '10' : '1';
      }
    });

    const ids = new Set(drivers.map(d => d.id));
    markers.current.forEach((mk, id) => {
      if (!ids.has(id)) {
        mk.remove(); markers.current.delete(id);
        roots.current.get(id)?.unmount(); roots.current.delete(id);
      }
    });
  }, [drivers, selectedDriver, onDriverSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
    </div>
  );
}

function drawCircuit(
  m: mapboxgl.Map,
  circuit: ReturnType<typeof useCircuit>,
  staticRef: React.MutableRefObject<mapboxgl.Marker[]>,
) {
  const add = (mk: mapboxgl.Marker) => { staticRef.current.push(mk); return mk; };

  m.addSource('circuit-track', {
    type: 'geojson',
    data: { type:'Feature', properties:{}, geometry:{ type:'LineString', coordinates: circuit.track } },
  });

  m.addLayer({ id:'track-glow',    type:'line', source:'circuit-track', paint:{ 'line-color':'#00ffff','line-width':20,'line-blur':14,'line-opacity':0.25 } });
  m.addLayer({ id:'track-surface', type:'line', source:'circuit-track', paint:{ 'line-color':'#3a3a3a','line-width':10,'line-opacity':0.85 } });
  m.addLayer({ id:'track-centre',  type:'line', source:'circuit-track', paint:{ 'line-color':'#00ffff','line-width':2.5,'line-opacity':0.9 } });

  circuit.turnLabels.forEach(({ lng, lat, label }) => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.3);border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);font-family:Inter,sans-serif;">${label.replace('T','')}</div>`;
    add(new mapboxgl.Marker({ element:el, anchor:'center' }).setLngLat([lng,lat]).addTo(m));
  });

  const sf = document.createElement('div');
  sf.innerHTML = `<div style="background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.6);border-radius:4px;padding:3px 10px;font-size:9px;font-weight:800;color:#fff;letter-spacing:0.08em;white-space:nowrap;font-family:Inter,sans-serif;">⬛⬜ START/FINISH</div>`;
  add(new mapboxgl.Marker({ element:sf, anchor:'center' }).setLngLat(circuit.startFinish).addTo(m));

  const info = document.createElement('div');
  info.innerHTML = `<div style="background:rgba(3,3,3,0.8);backdrop-filter:blur(12px);border:1px solid rgba(0,255,255,0.4);border-radius:8px;padding:8px 14px;"><div style="font-size:11px;font-weight:800;color:#00ffff;letter-spacing:0.07em;font-family:Inter,sans-serif;">${circuit.name.toUpperCase()}</div><div style="font-size:9px;color:rgba(255,255,255,0.5);margin-top:2px;font-family:Inter,sans-serif;">${circuit.location} · ${circuit.length} · ${circuit.turns} Turns</div></div>`;
  add(new mapboxgl.Marker({ element:info, anchor:'top-left' }).setLngLat(circuit.badgeAnchor).addTo(m));
}