import { useState, useEffect, useMemo } from 'react';
import { sb } from './supabase';
import { T } from './i18n';
import { CATS, fetchOsm } from './places';
import MapView from './MapView';
import Account from './Account';
import Nannies from './Nannies';

const START = { c: [50.0647, 19.945], z: 15, b: null };
const dist = (a, b) => {
  const r = Math.PI / 180, x = (b[1] - a[1]) * r * Math.cos(((a[0] + b[0]) * r) / 2), y = (b[0] - a[0]) * r;
  return Math.hypot(x, y) * 6371000;
};
const fmt = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);
const toPlace = (r) => ({ id: 'u-' + r.id, name: r.name, cat: r.cat, lat: r.lat, lng: r.lng, wheelchair: r.wheelchair, changing: r.changing, src: 'user' });
const local = () => JSON.parse(localStorage.getItem('favs') || '[]');

function Row({ p, t, fav, onFav, onOpen }) {
  return (
    <div className="card row-card" onClick={() => onOpen(p)}>
      <div className="ico" style={{ background: CATS[p.cat].color }}>{CATS[p.cat].emoji}</div>
      <div className="grow">
        <b>{p.name || t(p.cat)}</b>
        <small>{t(p.cat)} · {fmt(p.d)}{p.wheelchair ? ' · ♿' : ''}</small>
      </div>
      <button className="heart" aria-label={t('fav')} onClick={(e) => { e.stopPropagation(); onFav(p); }}>{fav ? '♥' : '♡'}</button>
    </div>
  );
}

function Sheet({ p, t, fav, onFav, onClose }) {
  return (
    <div className="sheet">
      <button className="x" aria-label="close" onClick={onClose}>×</button>
      <h3>{CATS[p.cat].emoji} {p.name || t(p.cat)}</h3>
      <div className="badges">
        <span>{t(p.cat)}</span>
        {p.wheelchair && <span>♿ {t('wheelchair')}</span>}
        {p.changing && p.cat !== 'changing' && <span>👶 {t('changing')}</span>}
        {p.src === 'user' && <span>🌱 {t('community')}</span>}
      </div>
      <div className="row">
        <a className="btn" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}>{t('navigate')}</a>
        <button className="btn ghost" onClick={() => onFav(p)}>{fav ? '♥' : '♡'} {t('fav')}</button>
      </div>
    </div>
  );
}

function AddForm({ t, onSave, onCancel }) {
  const [f, setF] = useState({ name: '', cat: 'playground', wheelchair: false, changing: false });
  const s = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <div className="sheet">
      <h3>{t('addTitle')}</h3>
      <input placeholder={t('placeName')} value={f.name} onChange={s('name')} />
      <select value={f.cat} onChange={s('cat')}>
        {Object.keys(CATS).map((c) => <option key={c} value={c}>{CATS[c].emoji} {t(c)}</option>)}
      </select>
      <label className="check"><input type="checkbox" checked={f.wheelchair} onChange={s('wheelchair')} /> ♿ {t('wheelchair')}</label>
      <label className="check"><input type="checkbox" checked={f.changing} onChange={s('changing')} /> 👶 {t('changing')}</label>
      <div className="row">
        <button className="btn" disabled={!f.name.trim()} onClick={() => onSave(f)}>{t('save')}</button>
        <button className="btn ghost" onClick={onCancel}>{t('cancel')}</button>
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'pl');
  const t = (k) => T[lang][k] || k;
  const [tab, setTab] = useState('map');
  const [user, setUser] = useState(null);
  const [view, setView] = useState(START);
  const [osm, setOsm] = useState([]);
  const [mine, setMine] = useState([]);
  const [on, setOn] = useState(Object.keys(CATS));
  const [wc, setWc] = useState(false);
  const [sel, setSel] = useState(null);
  const [fly, setFly] = useState(null);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [favs, setFavs] = useState(local);

  const changeLang = () => { const n = lang === 'pl' ? 'en' : 'pl'; setLang(n); localStorage.setItem('lang', n); document.documentElement.lang = n; };

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
    sb.from('places').select('*').limit(1000).then(({ data }) => data && setMine(data.map(toPlace)));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sb || !user) { setFavs(local()); return; }
    sb.from('favorites').select('place').then(({ data }) => data && setFavs(data.map((r) => r.place)));
  }, [user]);

  useEffect(() => {
    if (!view.b || view.z < 13) return;
    const id = setTimeout(async () => {
      setLoading(true);
      try { setOsm(await fetchOsm(view.b)); setErr(false); } catch { setErr(true); }
      setLoading(false);
    }, 600);
    return () => clearTimeout(id);
  }, [view.b]);

  const places = useMemo(() => [...osm, ...mine]
    .filter((p) => on.includes(p.cat) && (!wc || p.wheelchair))
    .filter((p) => !view.b || (p.lat >= view.b.s && p.lat <= view.b.n && p.lng >= view.b.w && p.lng <= view.b.e)),
  [osm, mine, on, wc, view.b]);

  const withDist = (arr) => arr.map((p) => ({ ...p, d: dist(view.c, [p.lat, p.lng]) }));
  const list = useMemo(() => withDist(places).sort((a, b) => a.d - b.d).slice(0, 100), [places, view.c]);
  const isFav = (p) => favs.some((f) => f.id === p.id);

  const toggleFav = async (p) => {
    const has = isFav(p);
    const { d, ...clean } = p;
    const next = has ? favs.filter((f) => f.id !== p.id) : [...favs, clean];
    setFavs(next);
    if (sb && user) {
      if (has) await sb.from('favorites').delete().eq('place_id', p.id);
      else await sb.from('favorites').insert({ place_id: p.id, place: clean });
    } else localStorage.setItem('favs', JSON.stringify(next));
  };

  const open = (p) => { setSel(p); setFly([p.lat, p.lng]); setTab('map'); };
  const locate = () => navigator.geolocation?.getCurrentPosition((p) => setFly([p.coords.latitude, p.coords.longitude]), () => {}, { enableHighAccuracy: true });
  const startAdd = () => { if (!user) { setTab('account'); return; } setAdding(true); setSel(null); };
  const savePlace = async (f) => {
    const { data, error } = await sb.from('places').insert({ name: f.name.trim(), cat: f.cat, lat: pending[0], lng: pending[1], wheelchair: f.wheelchair, changing: f.changing }).select().single();
    if (!error) setMine((m) => [...m, toPlace(data)]);
    setPending(null);
  };
  const toggleCat = (c) => setOn((o) => (o.includes(c) ? o.filter((x) => x !== c) : [...o, c]));

  const hint = view.z < 13 ? t('zoomIn') : loading ? t('loading') : err ? t('err') : '';
  const tabs = [['map', '🗺️'], ['list', '📋'], ['favs', '♥'], ['nanny', '🧸'], ['account', '👤']];

  return (
    <div className="app">
      <header>
        <h1>🌿 Baby in the Wild</h1>
        <button className="lang" onClick={changeLang}>{lang === 'pl' ? 'EN' : 'PL'}</button>
      </header>

      {(tab === 'map' || tab === 'list') && (
        <div className="filters">
          {Object.keys(CATS).map((c) => (
            <button key={c} className={'chip' + (on.includes(c) ? ' on' : '')} onClick={() => toggleCat(c)}>{CATS[c].emoji} {t(c)}</button>
          ))}
          <button className={'chip' + (wc ? ' on' : '')} onClick={() => setWc(!wc)}>♿ {t('wheelchair')}</button>
        </div>
      )}

      <main>
        {tab === 'map' && (
          <>
            <MapView places={places} view={view} onView={setView} onSelect={setSel} addMode={adding} onPick={(ll) => { setAdding(false); setPending([ll.lat, ll.lng]); }}
              fly={fly} onFlown={() => setFly(null)} selectedId={sel?.id} />
            {adding ? <div className="hint">{t('tapMap')} <button className="inline" onClick={() => setAdding(false)}>×</button></div> : hint && <div className="hint">{hint}</div>}
            {!pending && (
              <div className={'fabs' + (sel ? ' up' : '')}>
                <button className="fab" aria-label="locate" onClick={locate}>📍</button>
                <button className="fab plus" aria-label={t('addTitle')} onClick={startAdd}>＋</button>
              </div>
            )}
            {pending ? <AddForm t={t} onSave={savePlace} onCancel={() => setPending(null)} />
              : sel && <Sheet p={sel} t={t} fav={isFav(sel)} onFav={toggleFav} onClose={() => setSel(null)} />}
          </>
        )}

        {tab === 'list' && (
          <div className="scroll">
            {hint && <div className="note">{hint}</div>}
            {!hint && list.length === 0 && <div className="note">{t('empty')}</div>}
            {list.map((p) => <Row key={p.id} p={p} t={t} fav={isFav(p)} onFav={toggleFav} onOpen={open} />)}
          </div>
        )}

        {tab === 'favs' && (
          <div className="scroll">
            {favs.length === 0 && <div className="note">{t('noFavs')}</div>}
            {withDist(favs).map((p) => <Row key={p.id} p={p} t={t} fav onFav={toggleFav} onOpen={open} />)}
          </div>
        )}

        {tab === 'nanny' && <Nannies t={t} />}
        {tab === 'account' && <Account t={t} user={user} />}
      </main>

      <nav>
        {tabs.map(([k, e]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><span>{e}</span>{t(k)}</button>
        ))}
      </nav>
    </div>
  );
}
