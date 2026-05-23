/**
 * RaceMap.tsx  —  3D pitch satellite view, circuit-aware
 * Uses useCircuit(location) to always show the correct track.
 */

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCircuit } from '../hooks/useCircuit';

mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  'pk.eyJ1Ijoicmlja3k4OTA5IiwiYSI6ImNtb3FoMmhhazByejgycXNldmUzaTF4MHMifQ.oO6Cu2k3S7eBBr91ZqbcNA';

interface Driver {
  id: string; name: string; abbreviation: string;
  team: string; color: string; position: number;
  lat: number; lng: number;
}

interface RaceMapProps {
  drivers:        Driver[];
  onDriverSelect: (driver: Driver | null) => void;
  selectedDriver: Driver | null;
  /** Pass sessionInfo?.location */
  location?:      string | null;
}

export default function RaceMap({ drivers, onDriverSelect, selectedDriver, location }: RaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const markersRef   = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const staticRef    = useRef<mapboxgl.Marker[]>([]);
  const prevKeyRef   = useRef<string>('');

  const circuit = useCircuit(location);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style:     'mapbox://styles/mapbox/satellite-streets-v12',
      center:    circuit.center,
      zoom:      circuit.zoom - 0.5,
      pitch:     45,
      bearing:   circuit.bearing,
      antialias: true,
    });

    mapRef.current.on('load', () => draw(mapRef.current!, circuit, staticRef));

    return () => {
      staticRef.current.forEach(m => m.remove());
      markersRef.current.forEach(m => m.remove());
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Redraw on circuit change ───────────────────────────────────────────────
  useEffect(() => {
    const m = mapRef.current;
    if (!m || prevKeyRef.current === circuit.key) return;
    prevKeyRef.current = circuit.key;

    const redraw = () => {
      staticRef.current.forEach(mk => mk.remove());
      staticRef.current = [];
      markersRef.current.forEach(mk => mk.remove());
      markersRef.current.clear();

      ['track-3d-glow','track-3d-surface','track-3d-centre'].forEach(id => {
        if (m.getLayer(id)) m.removeLayer(id);
      });
      if (m.getSource('circuit-3d')) m.removeSource('circuit-3d');

      draw(m, circuit, staticRef);
      m.flyTo({ center: circuit.center, zoom: circuit.zoom - 0.5, bearing: circuit.bearing, pitch: 45, duration: 1400, essential: true });
    };

    if (m.isStyleLoaded()) redraw(); else m.once('load', redraw);
  }, [circuit]);

  // ── Driver markers ────────────────────────────────────────────────────────
  useEffect(() => {
    const m = mapRef.current;
    if (!m?.loaded()) return;

    const seen = new Set<string>();
    drivers.forEach(driver => {
      seen.add(driver.id);
      const isSelected = selectedDriver?.id === driver.id;
      let marker = markersRef.current.get(driver.id);
      const html = markerHTML(driver, isSelected);

      if (!marker) {
        const el = document.createElement('div');
        el.style.cssText = 'cursor:pointer;';
        el.innerHTML = html;
        el.onclick = () => onDriverSelect(isSelected ? null : driver);
        marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([driver.lng, driver.lat]).addTo(m);
        markersRef.current.set(driver.id, marker);
      } else {
        marker.setLngLat([driver.lng, driver.lat]);
        marker.getElement().innerHTML = html;
        marker.getElement().onclick = () => onDriverSelect(isSelected ? null : driver);
      }
    });

    markersRef.current.forEach((mk, id) => {
      if (!seen.has(id)) { mk.remove(); markersRef.current.delete(id); }
    });
  }, [drivers, selectedDriver, onDriverSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

function draw(
  m: mapboxgl.Map,
  circuit: ReturnType<typeof useCircuit>,
  staticRef: React.MutableRefObject<mapboxgl.Marker[]>,
) {
  const add = (mk: mapboxgl.Marker) => { staticRef.current.push(mk); return mk; };

  m.addSource('circuit-3d', {
    type: 'geojson',
    data: { type:'Feature', properties:{}, geometry:{ type:'LineString', coordinates: circuit.track } },
  });

  m.addLayer({ id:'track-3d-glow',    type:'line', source:'circuit-3d', paint:{ 'line-color':'#00ffff','line-width':24,'line-blur':16,'line-opacity':0.18 } });
  m.addLayer({ id:'track-3d-surface', type:'line', source:'circuit-3d', paint:{ 'line-color':'#2a2a2a','line-width':11,'line-opacity':0.95 } });
  m.addLayer({ id:'track-3d-centre',  type:'line', source:'circuit-3d', paint:{ 'line-color':'#00ffff','line-width':2,'line-opacity':0.85 } });

  // Sector markers
  circuit.sectors.forEach(({ lng, lat, label, color }) => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="background:${color}22;border:1px solid ${color}88;color:${color};padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;font-family:Inter,sans-serif;">${label}</div>`;
    add(new mapboxgl.Marker({ element:el, anchor:'center' }).setLngLat([lng,lat]).addTo(m));
  });

  // S/F
  const sf = document.createElement('div');
  sf.innerHTML = `<div style="background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.55);border-radius:4px;padding:3px 10px;font-size:9px;font-weight:800;color:#fff;white-space:nowrap;font-family:Inter,sans-serif;">⬛⬜ S/F</div>`;
  add(new mapboxgl.Marker({ element:sf, anchor:'center' }).setLngLat(circuit.startFinish).addTo(m));

  // Badge
  const badge = document.createElement('div');
  badge.innerHTML = `<div style="background:rgba(0,0,0,0.8);backdrop-filter:blur(12px);border:1px solid rgba(0,255,255,0.4);border-radius:8px;padding:8px 14px;"><div style="font-size:11px;font-weight:800;color:#00ffff;letter-spacing:0.07em;font-family:Inter,sans-serif;">${circuit.name.toUpperCase()}</div><div style="font-size:9px;color:rgba(255,255,255,0.5);margin-top:2px;font-family:Inter,sans-serif;">${circuit.location} · ${circuit.length}</div></div>`;
  add(new mapboxgl.Marker({ element:badge, anchor:'top-left' }).setLngLat(circuit.badgeAnchor).addTo(m));
}

function markerHTML(driver: Driver, selected: boolean): string {
  const c = driver.color ?? '#fff';
  return `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:${selected?'#00ffff':c};color:${selected?'#000':'#fff'};font-size:8px;font-weight:900;padding:2px 6px;border-radius:3px;white-space:nowrap;font-family:Inter,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.6);margin-bottom:2px;">${driver.position}. ${driver.abbreviation}</div>
      <div style="width:10px;height:10px;border-radius:50%;background:${c};border:2px solid ${selected?'#00ffff':'rgba(255,255,255,0.4)'};box-shadow:0 0 ${selected?12:6}px ${selected?'#00ffff':c};"></div>
    </div>
  `;
}