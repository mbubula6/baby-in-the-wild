import { useState, useEffect } from 'react';
import { sb } from './supabase';

const DEMO = [
  { id: 'd1', display_name: 'Ola K.', city: 'Kraków', rating: 4.9, rate: 40, availability: 'pn–pt 8:00–16:00', bio: 'Pedagożka, 6 lat doświadczenia z maluchami.' },
  { id: 'd2', display_name: 'Marta W.', city: 'Kraków', rating: 4.7, rate: 35, availability: 'wt, czw 12:00–20:00', bio: 'Studentka pielęgniarstwa, kurs pierwszej pomocy.' },
  { id: 'd3', display_name: 'Ania S.', city: 'Kraków', rating: 4.8, rate: 45, availability: 'weekendy', bio: 'Mówię po angielsku i niemiecku.' },
];

export default function Nannies({ t }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    if (!sb) { setRows([]); return; }
    sb.from('profiles').select('*').eq('is_nanny', true).limit(50).then(({ data }) => setRows(data || []));
  }, []);
  if (!rows) return null;
  const demo = rows.length === 0;
  const list = demo ? DEMO : rows;
  return (
    <div className="scroll">
      <div className="note">🧸 {t('nannyIntro')} <b>{t('soon')}</b>{demo && ` · ${t('demo')}`}</div>
      {list.map((n) => (
        <div key={n.id} className="card">
          <div className="between"><b>{n.display_name || '—'}</b><span>⭐ {n.rating ?? '—'}</span></div>
          <small>{n.city}{n.rate ? ` · ${n.rate} ${t('perH')}` : ''}</small>
          {n.availability && <div className="badges"><span>🕒 {n.availability}</span></div>}
          {n.bio && <p>{n.bio}</p>}
        </div>
      ))}
    </div>
  );
}
