import { useState, useEffect } from 'react';
import { sb } from './supabase';

export default function Account({ t, user }) {
  const [mode, setMode] = useState('in');
  const [f, setF] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [p, setP] = useState({ display_name: '', city: '', bio: '', is_nanny: false, rate: '', availability: '' });

  useEffect(() => {
    if (!sb || !user) return;
    sb.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) setP((x) => ({ ...x, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ''])) }));
    });
  }, [user]);

  if (!sb) return <div className="scroll"><div className="card">{t('noSb')}</div></div>;

  const auth = async (e) => {
    e.preventDefault(); setMsg('');
    const { data, error } = mode === 'in' ? await sb.auth.signInWithPassword(f) : await sb.auth.signUp(f);
    if (error) setMsg(error.message);
    else if (mode === 'up' && !data.session) setMsg(t('checkMail'));
  };
  const save = async () => {
    const { error } = await sb.from('profiles').upsert({
      id: user.id, display_name: p.display_name, city: p.city, bio: p.bio, is_nanny: !!p.is_nanny,
      rate: p.rate === '' ? null : Number(p.rate), availability: p.availability,
    });
    setMsg(error ? error.message : t('saved'));
  };
  const s = (k) => (e) => setP({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  if (!user) {
    return (
      <div className="scroll">
        <form className="card form" onSubmit={auth}>
          <h2>{mode === 'in' ? t('login') : t('signup')}</h2>
          <input type="email" required placeholder={t('email')} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input type="password" required minLength={6} placeholder={t('password')} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <button className="btn">{mode === 'in' ? t('login') : t('signup')}</button>
          {msg && <div className="note">{msg}</div>}
          <button type="button" className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(''); }}>{mode === 'in' ? t('noAcc') : t('haveAcc')}</button>
        </form>
      </div>
    );
  }
  return (
    <div className="scroll">
      <div className="card form">
        <h2>{t('profile')}</h2>
        <small>{user.email}</small>
        <input placeholder={t('name')} value={p.display_name} onChange={s('display_name')} />
        <input placeholder={t('city')} value={p.city} onChange={s('city')} />
        <textarea rows={3} placeholder={t('bio')} value={p.bio} onChange={s('bio')} />
        <label className="check"><input type="checkbox" checked={!!p.is_nanny} onChange={s('is_nanny')} /> {t('isNanny')}</label>
        {p.is_nanny && (
          <>
            <input type="number" min="0" placeholder={t('rate')} value={p.rate} onChange={s('rate')} />
            <input placeholder={t('avail')} value={p.availability} onChange={s('availability')} />
          </>
        )}
        <button className="btn" onClick={save}>{t('save')}</button>
        {msg && <div className="note">{msg}</div>}
        <button className="btn ghost" onClick={() => sb.auth.signOut()}>{t('logout')}</button>
      </div>
    </div>
  );
}
