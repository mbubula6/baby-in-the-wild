export const CATS = {
  playground: { emoji: '🛝', color: '#5bb381' },
  kindergarten: { emoji: '🎒', color: '#e9a23b' },
  nursery: { emoji: '🍼', color: '#e88fae' },
  toilet: { emoji: '🚻', color: '#5ba7d9' },
  changing: { emoji: '👶', color: '#9c85d6' },
};

function catOf(t) {
  if (t.leisure === 'playground') return 'playground';
  if (t.amenity === 'kindergarten') return 'kindergarten';
  if (t.amenity === 'childcare') return 'nursery';
  if (t.changing_table === 'yes') return 'changing';
  if (t.amenity === 'toilets') return 'toilet';
  return null;
}

// Swap this function for a Google Places call later; keep the returned shape.
export async function fetchOsm(b) {
  const bb = `${b.s},${b.w},${b.n},${b.e}`;
  const q = `[out:json][timeout:20];(nwr["leisure"="playground"](${bb});nwr["amenity"~"^(kindergarten|childcare|toilets)$"](${bb});nwr["changing_table"="yes"](${bb}););out center 300;`;
  const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) });
  if (!r.ok) throw new Error('overpass');
  const j = await r.json();
  return j.elements.map((e) => {
    const t = e.tags || {};
    const lat = e.lat ?? e.center?.lat;
    const lng = e.lon ?? e.center?.lon;
    const cat = catOf(t);
    if (!cat || lat == null) return null;
    return { id: `osm-${e.type}-${e.id}`, name: t.name || null, cat, lat, lng, wheelchair: t.wheelchair === 'yes', changing: t.changing_table === 'yes', src: 'osm' };
  }).filter(Boolean);
}
