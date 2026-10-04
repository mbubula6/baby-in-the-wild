import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATS } from './places';

const icon = (c, sel) => L.divIcon({
  className: '',
  html: `<div class="pin${sel ? ' sel' : ''}" style="background:${CATS[c].color}">${CATS[c].emoji}</div>`,
  iconSize: [34, 34], iconAnchor: [17, 17],
});

export default function MapView({ places, view, onView, onSelect, addMode, onPick, fly, onFlown, selectedId }) {
  const el = useRef(), map = useRef(), layer = useRef();
  const addRef = useRef(addMode), pickRef = useRef(onPick);
  addRef.current = addMode; pickRef.current = onPick;

  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false }).setView(view.c, view.z);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    L.control.zoom({ position: 'topright' }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    const emit = () => {
      const b = m.getBounds(), c = m.getCenter();
      onView({ c: [c.lat, c.lng], z: m.getZoom(), b: { s: b.getSouth(), w: b.getWest(), n: b.getNorth(), e: b.getEast() } });
    };
    m.on('moveend', emit);
    m.on('click', (e) => addRef.current && pickRef.current(e.latlng));
    map.current = m; emit();
    return () => m.remove();
  }, []);

  useEffect(() => {
    layer.current.clearLayers();
    places.forEach((p) => L.marker([p.lat, p.lng], { icon: icon(p.cat, p.id === selectedId) })
      .on('click', (e) => { L.DomEvent.stopPropagation(e); onSelect(p); }).addTo(layer.current));
  }, [places, selectedId]);

  useEffect(() => { if (fly) { map.current.setView(fly, 16); onFlown(); } }, [fly]);

  return <div ref={el} className="map" />;
}
