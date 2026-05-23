/**
 * VectorTrackMap.tsx
 *
 * Dark vector Mapbox map that automatically loads the correct circuit
 * for whatever session is live — no more hardcoded COTA.
 *
 * Circuit is resolved from `sessionInfo?.location` via useCircuit().
 * When the location changes (e.g. replay jumps to a different race)
 * the map re-centres and redraws the track.
 */

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { ProcessedDriver } from '../hooks/useOpenF1';
import { useCircuit } from '../hooks/useCircuit';

mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  'pk.eyJ1Ijoicmlja3k4OTA5IiwiYSI6ImNtb3FoMmhhazByejgycXNldmUzaTF4MHMifQ.oO6Cu2k3S7eBBr91ZqbcNA';

interface VectorTrackMapProps {
  drivers:          ProcessedDriver[];
  onDriverClick:    (driver: ProcessedDriver | null) => void;
  selectedDriverId?: string | null;
  battles?:         { driver1: string; driver2: string; gap: number }[];
  /** Pass sessionInfo?.location from useOpenF1Live() */
  location?:        string | null;
}

export default function VectorTrackMap({
  drivers,
  onDriverClick,
  selectedDriverId,
  battles = [],
  location,
}: VectorTrackMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<mapboxgl.Map | null>(null);
  const markersRef    = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const staticRef     = useRef<mapboxgl.Marker[]>([]);
  const prevKeyRef    = useRef<string>('');

  const circuit = useCircuit(location);

  // ── Init map (once) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     'mapbox://styles/mapbox/dark-v11',
      center:    circuit.center,
      zoom:      circuit.zoom,
      pitch:     circuit.pitch,
      bearing:   circuit.bearing,
      antialias: true,
    });

    mapRef.current = map;

    map.on('load', () => drawCircuit(map, circuit, staticRef));

    return () => {
      staticRef.current.forEach(m => m.remove());
      staticRef.current = [];
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Redraw when circuit changes ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || prevKeyRef.current === circuit.key) return;
    prevKeyRef.current = circuit.key;

    const redraw = () => {
      // Remove old static markers
      staticRef.current.forEach(m => m.remove());
      staticRef.current = [];

      // Remove old driver markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();

      // Remove old track layers / sources
      ['track-glow','track-surface','track-kerb-l','track-kerb-r','track-centre']
        .forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
      if (map.getSource('circuit-track')) map.removeSource('circuit-track');

      drawCircuit(map, circuit, staticRef);

      map.flyTo({
        center:   circuit.center,
        zoom:     circuit.zoom,
        bearing:  circuit.bearing,
        pitch:    circuit.pitch,
        duration: 1200,
        essential: true,
      });
    };

    if (map.isStyleLoaded()) redraw();
    else map.once('load', redraw);
  }, [circuit]);

  // ── Driver markers ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;

    const seen      = new Set<string>();
    const battleSet = new Set(battles.flatMap(b => [b.driver1, b.driver2]));

    drivers.forEach(driver => {
      seen.add(driver.id);
      const isSelected = selectedDriverId === driver.id;
      const inBattle   = battleSet.has(driver.id);
      let   marker     = markersRef.current.get(driver.id);
      const html       = buildMarkerHTML(driver, isSelected, inBattle);

      if (!marker) {
        const el = document.createElement('div');
        el.style.cssText = 'cursor:pointer;position:relative;';
        el.innerHTML = html;
        el.addEventListener('click', () => onDriverClick(isSelected ? null : driver));
        marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([driver.lng, driver.lat])
          .addTo(map);
        markersRef.current.set(driver.id, marker);
      } else {
        marker.setLngLat([driver.lng, driver.lat]);
        marker.getElement().innerHTML = html;
        marker.getElement().onclick = () => onDriverClick(isSelected ? null : driver);
      }
    });

    markersRef.current.forEach((m, id) => {
      if (!seen.has(id)) { m.remove(); markersRef.current.delete(id); }
    });
  }, [drivers, selectedDriverId, battles, onDriverClick]);

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

// ─── Draw circuit layers + static markers ─────────────────────────────────────
function drawCircuit(
  map: mapboxgl.Map,
  circuit: ReturnType<typeof useCircuit>,
  staticRef: React.MutableRefObject<mapboxgl.Marker[]>,
) {
  // Track polyline source
  map.addSource('circuit-track', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: circuit.track },
    },
  });

  map.addLayer({ id:'track-glow',    type:'line', source:'circuit-track', paint:{ 'line-color':'#00ffff','line-width':22,'line-blur':18,'line-opacity':0.12 } });
  map.addLayer({ id:'track-surface', type:'line', source:'circuit-track', paint:{ 'line-color':'#3a3a3a','line-width':9,'line-opacity':1 } });
  map.addLayer({ id:'track-kerb-l',  type:'line', source:'circuit-track', paint:{ 'line-color':'#fff','line-width':1.5,'line-opacity':0.4,'line-offset':4.5 } });
  map.addLayer({ id:'track-kerb-r',  type:'line', source:'circuit-track', paint:{ 'line-color':'#fff','line-width':1.5,'line-opacity':0.4,'line-offset':-4.5 } });
  map.addLayer({ id:'track-centre',  type:'line', source:'circuit-track', paint:{ 'line-color':'#00ffff','line-width':2,'line-opacity':0.8 } });

  const add = (m: mapboxgl.Marker) => { staticRef.current.push(m); return m; };

  // Turn labels
  circuit.turnLabels.forEach(({ lng, lat, label }) => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="width:20px;height:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.6);font-family:Inter,sans-serif;">${label.replace('T','')}</div>`;
    add(new mapboxgl.Marker({ element:el, anchor:'center' }).setLngLat([lng,lat]).addTo(map));
  });

  // DRS zones
  circuit.drsZones.forEach(({ lng, lat, label }) => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="background:rgba(0,200,100,0.12);border:1px solid rgba(0,200,100,0.4);color:#00c864;padding:2px 7px;border-radius:3px;font-size:8px;font-weight:800;font-family:Inter,sans-serif;">${label}</div>`;
    add(new mapboxgl.Marker({ element:el, anchor:'center' }).setLngLat([lng,lat]).addTo(map));
  });

  // Sector markers
  circuit.sectors.forEach(({ lng, lat, label, color }) => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="background:${color}22;border:1px solid ${color}88;color:${color};padding:2px 7px;border-radius:4px;font-size:10px;font-weight:800;font-family:Inter,sans-serif;">${label}</div>`;
    add(new mapboxgl.Marker({ element:el, anchor:'center' }).setLngLat([lng,lat]).addTo(map));
  });

  // Start / finish line
  const sf = document.createElement('div');
  sf.innerHTML = `<div style="background:rgba(0,0,0,0.82);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.5);border-radius:4px;padding:3px 10px;font-size:9px;font-weight:800;color:#fff;letter-spacing:0.08em;white-space:nowrap;font-family:Inter,sans-serif;">⬛⬜ S/F</div>`;
  add(new mapboxgl.Marker({ element:sf, anchor:'center' }).setLngLat(circuit.startFinish).addTo(map));

  // Circuit info badge
  const badge = document.createElement('div');
  badge.innerHTML = `<div style="background:rgba(3,3,3,0.82);backdrop-filter:blur(12px);border:1px solid rgba(0,255,255,0.35);border-radius:8px;padding:8px 14px;pointer-events:none;"><div style="font-size:11px;font-weight:800;color:#00ffff;letter-spacing:0.07em;font-family:Inter,sans-serif;">${circuit.name.toUpperCase()}</div><div style="font-size:9px;color:rgba(255,255,255,0.5);margin-top:2px;font-family:Inter,sans-serif;">${circuit.location} · ${circuit.length} · ${circuit.turns} Turns</div></div>`;
  add(new mapboxgl.Marker({ element:badge, anchor:'top-left' }).setLngLat(circuit.badgeAnchor).addTo(map));
}

// ─── Driver marker HTML ───────────────────────────────────────────────────────
function buildMarkerHTML(driver: ProcessedDriver, selected: boolean, inBattle: boolean): string {
  const c         = driver.color ?? '#fff';
  const r         = driver.heading ?? 0;
  const thr       = driver.throttle ?? 0;
  const brk       = driver.brake    ?? 0;
  const haloColor = brk > 20 ? '#ef4444' : thr > 60 ? '#22c55e' : 'rgba(255,255,255,0.3)';
  const haloSize  = selected ? 14 : inBattle ? 10 : 6;
  const glowColor = selected ? '#00ffff' : inBattle ? '#fbbf24' : c;

  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);background:${selected?'#00ffff':c};color:${selected?'#000':'#fff'};font-size:8px;font-weight:900;padding:1px 5px;border-radius:3px;white-space:nowrap;pointer-events:none;box-shadow:0 1px 4px rgba(0,0,0,0.7);font-family:Inter,sans-serif;">${driver.position}. ${driver.abbreviation}</div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${32+haloSize}px;height:${32+haloSize}px;border-radius:50%;border:2px solid ${haloColor};opacity:0.7;box-shadow:0 0 ${haloSize}px ${haloColor};pointer-events:none;"></div>
      <svg width="30" height="30" viewBox="0 0 30 30" style="transform:rotate(${r}deg);filter:drop-shadow(0 0 ${selected?8:3}px ${glowColor});">
        <ellipse cx="15" cy="15" rx="4.5" ry="8.5" fill="${c}" opacity="0.95"/>
        <ellipse cx="15" cy="13" rx="2.2" ry="3.8" fill="#111" opacity="0.85"/>
        <rect x="10.5" y="22" width="9" height="2" rx="1" fill="${c}" opacity="0.8"/>
        <rect x="10.5" y="6"  width="9" height="2" rx="1" fill="${c}" opacity="0.8"/>
        <rect x="7"  y="7"  width="3" height="5" rx="1.5" fill="#1a1a1a" stroke="#444" stroke-width="0.5"/>
        <rect x="20" y="7"  width="3" height="5" rx="1.5" fill="#1a1a1a" stroke="#444" stroke-width="0.5"/>
        <rect x="7"  y="18" width="3" height="5" rx="1.5" fill="#1a1a1a" stroke="#444" stroke-width="0.5"/>
        <rect x="20" y="18" width="3" height="5" rx="1.5" fill="#1a1a1a" stroke="#444" stroke-width="0.5"/>
        ${selected ? `<circle cx="15" cy="15" r="12" fill="none" stroke="#00ffff" stroke-width="1.5" opacity="0.5"/>` : ''}
        ${driver.drs ? `<rect x="6" y="5" width="18" height="1.5" rx="0.5" fill="#22c55e" opacity="0.9"/>` : ''}
      </svg>
      ${driver.drs ? `<div style="position:absolute;bottom:-12px;font-size:7px;font-weight:900;color:#22c55e;font-family:Inter,sans-serif;letter-spacing:0.05em;">DRS</div>` : ''}
    </div>
  `;
}