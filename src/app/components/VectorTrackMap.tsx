import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { ProcessedDriver } from '../hooks/useOpenF1';

mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  'pk.eyJ1Ijoicmlja3k4OTA5IiwiYSI6ImNtb3FoMmhhazByejgycXNldmUzaTF4MHMifQ.oO6Cu2k3S7eBBr91ZqbcNA';

const COTA: [number, number][] = [
  [-97.63580,30.13380],[-97.63650,30.13405],[-97.63720,30.13430],[-97.63790,30.13455],[-97.63855,30.13478],
  [-97.63920,30.13510],[-97.63970,30.13548],[-97.63995,30.13590],[-97.63985,30.13635],[-97.63960,30.13670],
  [-97.63920,30.13695],[-97.63870,30.13705],[-97.63820,30.13695],[-97.63780,30.13670],
  [-97.63750,30.13640],[-97.63735,30.13605],[-97.63740,30.13565],[-97.63760,30.13535],
  [-97.63790,30.13510],[-97.63830,30.13495],[-97.63870,30.13490],
  [-97.63910,30.13480],[-97.63950,30.13462],[-97.63980,30.13435],[-97.63990,30.13400],
  [-97.63975,30.13365],[-97.63945,30.13340],[-97.63905,30.13325],
  [-97.63860,30.13315],[-97.63810,30.13310],[-97.63760,30.13312],
  [-97.63715,30.13318],[-97.63680,30.13335],[-97.63660,30.13362],[-97.63658,30.13398],[-97.63670,30.13432],
  [-97.63695,30.13458],[-97.63712,30.13488],[-97.63708,30.13518],[-97.63692,30.13542],
  [-97.63668,30.13558],[-97.63638,30.13562],[-97.63608,30.13555],
  [-97.63578,30.13540],[-97.63548,30.13520],[-97.63520,30.13495],
  [-97.63500,30.13465],[-97.63495,30.13432],[-97.63505,30.13400],[-97.63525,30.13375],[-97.63555,30.13358],
  [-97.63590,30.13348],[-97.63610,30.13355],[-97.63620,30.13368],[-97.63612,30.13380],
  [-97.63600,30.13380],[-97.63580,30.13380],
];

const TURN_LABELS: [number,number,number][] = [
  [-97.63940,30.13520,1],[-97.63870,30.13712,3],[-97.63995,30.13470,9],
  [-97.63650,30.13305,11],[-97.63600,30.13570,15],[-97.63480,30.13425,18],[-97.63590,30.13335,19],
];

interface VectorTrackMapProps {
  drivers: ProcessedDriver[];
  onDriverClick: (driver: ProcessedDriver | null) => void;
  selectedDriverId?: string | null;
  battles?: { driver1: string; driver2: string; gap: number }[];
}

export default function VectorTrackMap({ drivers, onDriverClick, selectedDriverId, battles = [] }: VectorTrackMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const markersRef   = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-97.63740, 30.13490],
      zoom: 14.6, pitch: 0, bearing: 17, antialias: true,
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('cota', { type:'geojson', data:{ type:'Feature', properties:{}, geometry:{ type:'LineString', coordinates:COTA } } });
      map.addLayer({ id:'track-glow',    type:'line', source:'cota', paint:{ 'line-color':'#00ffff','line-width':22,'line-blur':18,'line-opacity':0.12 } });
      map.addLayer({ id:'track-surface', type:'line', source:'cota', paint:{ 'line-color':'#3a3a3a','line-width':9,'line-opacity':1 } });
      map.addLayer({ id:'track-kerb-l',  type:'line', source:'cota', paint:{ 'line-color':'#fff','line-width':1.5,'line-opacity':0.4,'line-offset':4.5 } });
      map.addLayer({ id:'track-kerb-r',  type:'line', source:'cota', paint:{ 'line-color':'#fff','line-width':1.5,'line-opacity':0.4,'line-offset':-4.5 } });
      map.addLayer({ id:'track-centre',  type:'line', source:'cota', paint:{ 'line-color':'#00ffff','line-width':2,'line-opacity':0.8 } });

      // Turn labels
      TURN_LABELS.forEach(([lng,lat,num]) => {
        const el = document.createElement('div');
        el.innerHTML = `<div style="width:20px;height:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.6);font-family:Inter,sans-serif;">${num}</div>`;
        new mapboxgl.Marker({ element:el, anchor:'center' }).setLngLat([lng,lat]).addTo(map);
      });

      // S/F line
      const sf = document.createElement('div');
      sf.innerHTML = `<div style="background:rgba(0,0,0,0.82);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.5);border-radius:4px;padding:3px 10px;font-size:9px;font-weight:800;color:#fff;letter-spacing:0.08em;white-space:nowrap;font-family:Inter,sans-serif;">⬛⬜ S/F</div>`;
      new mapboxgl.Marker({ element:sf, anchor:'center' }).setLngLat([-97.63720,30.13442]).addTo(map);

      // Sectors
      [[-97.63920,30.13510,'S1','#ef4444'],[-97.63990,30.13400,'S2','#f59e0b'],[-97.63505,30.13400,'S3','#22c55e']].forEach(([lng,lat,label,color]) => {
        const el = document.createElement('div');
        el.innerHTML = `<div style="background:${color}22;border:1px solid ${color}88;color:${color};padding:2px 7px;border-radius:4px;font-size:10px;font-weight:800;font-family:Inter,sans-serif;">${label}</div>`;
        new mapboxgl.Marker({ element:el, anchor:'center' }).setLngLat([lng as number,lat as number]).addTo(map);
      });

      // DRS zones
      [[-97.63720,30.13390,'DRS 1'],[-97.63540,30.13510,'DRS 2']].forEach(([lng,lat,label]) => {
        const el = document.createElement('div');
        el.innerHTML = `<div style="background:rgba(0,200,100,0.12);border:1px solid rgba(0,200,100,0.4);color:#00c864;padding:2px 7px;border-radius:3px;font-size:8px;font-weight:800;font-family:Inter,sans-serif;">${label}</div>`;
        new mapboxgl.Marker({ element:el, anchor:'center' }).setLngLat([lng as number,lat as number]).addTo(map);
      });

      // Circuit badge
      const badge = document.createElement('div');
      badge.innerHTML = `<div style="background:rgba(3,3,3,0.82);backdrop-filter:blur(12px);border:1px solid rgba(0,255,255,0.35);border-radius:8px;padding:8px 14px;pointer-events:none;"><div style="font-size:11px;font-weight:800;color:#00ffff;letter-spacing:0.07em;font-family:Inter,sans-serif;">CIRCUIT OF THE AMERICAS</div><div style="font-size:9px;color:rgba(255,255,255,0.5);margin-top:2px;font-family:Inter,sans-serif;">Austin, Texas · 5.513 km · 20 Turns</div></div>`;
      new mapboxgl.Marker({ element:badge, anchor:'top-left' }).setLngLat([-97.64060,30.13680]).addTo(map);
    });

    return () => { markersRef.current.forEach(m=>m.remove()); markersRef.current.clear(); map.remove(); mapRef.current=null; };
  }, []);

  // Update driver markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;
    const seen = new Set<string>();
    const battleSet = new Set(battles.flatMap(b=>[b.driver1,b.driver2]));

    drivers.forEach(driver => {
      seen.add(driver.id);
      const isSelected = selectedDriverId === driver.id;
      const inBattle   = battleSet.has(driver.id);
      let marker = markersRef.current.get(driver.id);

      const html = buildMarkerHTML(driver, isSelected, inBattle);

      if (!marker) {
        const el = document.createElement('div');
        el.style.cssText = 'cursor:pointer;position:relative;';
        el.innerHTML = html;
        el.addEventListener('click', () => onDriverClick(isSelected ? null : driver));
        marker = new mapboxgl.Marker({ element:el, anchor:'center' }).setLngLat([driver.lng,driver.lat]).addTo(map);
        markersRef.current.set(driver.id, marker);
      } else {
        marker.setLngLat([driver.lng, driver.lat]);
        marker.getElement().innerHTML = html;
        marker.getElement().onclick = () => onDriverClick(isSelected ? null : driver);
      }
    });

    markersRef.current.forEach((m,id) => { if (!seen.has(id)) { m.remove(); markersRef.current.delete(id); } });
  }, [drivers, selectedDriverId, battles, onDriverClick]);

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

function buildMarkerHTML(driver: ProcessedDriver, selected: boolean, inBattle: boolean): string {
  const c   = driver.color ?? '#fff';
  const r   = driver.heading ?? 0;
  const thr = driver.throttle ?? 0;
  const brk = driver.brake    ?? 0;

  // Speed halo colour: red under braking, green on throttle, white neutral
  const haloColor = brk > 20 ? '#ef4444' : thr > 60 ? '#22c55e' : 'rgba(255,255,255,0.3)';
  const haloSize  = selected ? 14 : inBattle ? 10 : 6;
  const glowColor = selected ? '#00ffff' : inBattle ? '#fbbf24' : c;

  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <!-- Name label -->
      <div style="
        position:absolute;top:-18px;left:50%;transform:translateX(-50%);
        background:${selected?'#00ffff':c};color:${selected?'#000':'#fff'};
        font-size:8px;font-weight:900;padding:1px 5px;border-radius:3px;
        white-space:nowrap;pointer-events:none;box-shadow:0 1px 4px rgba(0,0,0,0.7);
        font-family:Inter,sans-serif;
      ">${driver.position}. ${driver.abbreviation}</div>

      <!-- Speed halo ring -->
      <div style="
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:${32+haloSize}px;height:${32+haloSize}px;border-radius:50%;
        border:2px solid ${haloColor};opacity:0.7;
        box-shadow:0 0 ${haloSize}px ${haloColor};
        pointer-events:none;
      "></div>

      <!-- Car SVG -->
      <svg width="30" height="30" viewBox="0 0 30 30"
        style="transform:rotate(${r}deg);filter:drop-shadow(0 0 ${selected?8:3}px ${glowColor});">
        <ellipse cx="15" cy="15" rx="4.5" ry="8.5" fill="${c}" opacity="0.95"/>
        <ellipse cx="15" cy="13"  rx="2.2" ry="3.8" fill="#111" opacity="0.85"/>
        <rect x="10.5" y="22" width="9" height="2" rx="1" fill="${c}" opacity="0.8"/>
        <rect x="10.5" y="6"  width="9" height="2" rx="1" fill="${c}" opacity="0.8"/>
        <rect x="7"  y="7"  width="3" height="5" rx="1.5" fill="#1a1a1a" stroke="#444" stroke-width="0.5"/>
        <rect x="20" y="7"  width="3" height="5" rx="1.5" fill="#1a1a1a" stroke="#444" stroke-width="0.5"/>
        <rect x="7"  y="18" width="3" height="5" rx="1.5" fill="#1a1a1a" stroke="#444" stroke-width="0.5"/>
        <rect x="20" y="18" width="3" height="5" rx="1.5" fill="#1a1a1a" stroke="#444" stroke-width="0.5"/>
        ${selected?`<circle cx="15" cy="15" r="12" fill="none" stroke="#00ffff" stroke-width="1.5" opacity="0.5"/>`:''}
        ${driver.drs?`<rect x="6" y="5" width="18" height="1.5" rx="0.5" fill="#22c55e" opacity="0.9"/>`:''}
      </svg>

      <!-- DRS badge -->
      ${driver.drs?`<div style="position:absolute;bottom:-12px;font-size:7px;font-weight:900;color:#22c55e;font-family:Inter,sans-serif;letter-spacing:0.05em;">DRS</div>`:''}
    </div>
  `;
}