'use client';
import { useState, useEffect } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const FONT = 'var(--font-hind-siliguri), sans-serif';

const s = {
  card: { background: '#1a1828', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  label: { fontSize: '11px', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'block' },
  input: { width: '100%', background: '#0f0e17', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px', fontFamily: FONT, outline: 'none', boxSizing: 'border-box' },
  btn: (color) => ({ background: color, border: 'none', borderRadius: '8px', padding: '10px 18px', color: '#fff', fontSize: '13px', fontWeight: '700', fontFamily: FONT, cursor: 'pointer' }),
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#0f0e17', borderRadius: '10px', marginBottom: '8px', gap: '12px' },
};

export default function PickupPointsTab() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', area: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/pickup_points?order=created_at.desc`, { headers: SB });
      const data = await res.json();
      setPoints(Array.isArray(data) ? data : []);
    } catch { setError('লোড হয়নি'); }
    setLoading(false);
  };

  useEffect(() => { fetchPoints(); }, []);

  const resetForm = () => { setForm({ name: '', address: '', area: '' }); setEditId(null); setError(''); };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('নাম দিন');
    if (!form.address.trim()) return setError('ঠিকানা দিন');
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await fetch(`${SUPABASE_URL}/rest/v1/pickup_points?id=eq.${editId}`, {
          method: 'PATCH', headers: SB,
          body: JSON.stringify({ name: form.name, address: form.address, area: form.area }),
        });
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/pickup_points`, {
          method: 'POST', headers: { ...SB, Prefer: 'return=representation' },
          body: JSON.stringify({ name: form.name, address: form.address, area: form.area, active: true }),
        });
      }
      resetForm();
      fetchPoints();
    } catch { setError('সেভ হয়নি'); }
    setSaving(false);
  };

  const handleToggle = async (id, active) => {
    await fetch(`${SUPABASE_URL}/rest/v1/pickup_points?id=eq.${id}`, {
      method: 'PATCH', headers: SB,
      body: JSON.stringify({ active: !active }),
    });
    fetchPoints();
  };

  const handleDelete = async (id) => {
    if (!confirm('এই পিকআপ পয়েন্ট মুছবেন?')) return;
    await fetch(`${SUPABASE_URL}/rest/v1/pickup_points?id=eq.${id}`, { method: 'DELETE', headers: SB });
    fetchPoints();
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, address: p.address, area: p.area || '' });
    setEditId(p.id);
  };

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0 }}>📍 Pickup Points</h2>
        <p style={{ color: 'rgba(255,255,255,.35)', fontSize: '13px', marginTop: '4px' }}>সেলফ পিকআপের জন্য ঠিকানা যোগ করুন</p>
      </div>

      {/* Form */}
      <div style={s.card}>
        <div style={{ color: '#818cf8', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
          {editId ? '✏️ পিকআপ পয়েন্ট আপডেট করুন' : '➕ নতুন পিকআপ পয়েন্ট'}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={s.label}>পয়েন্টের নাম *</label>
            <input style={s.input} placeholder="যেমন: উত্তরা গুদাম" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>এলাকা</label>
            <input style={s.input} placeholder="যেমন: উত্তরা, ঢাকা" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={s.label}>পূর্ণ ঠিকানা *</label>
          <input style={s.input} placeholder="বাড়ি / রাস্তা / এলাকার বিস্তারিত ঠিকানা" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSave} disabled={saving} style={s.btn('#818cf8')}>
            {saving ? 'সেভ হচ্ছে...' : editId ? 'আপডেট করুন' : 'যোগ করুন'}
          </button>
          {editId && (
            <button onClick={resetForm} style={s.btn('rgba(255,255,255,.1)')}>বাতিল</button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={s.card}>
        <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
          সব পিকআপ পয়েন্ট ({points.length})
        </div>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '13px' }}>লোড হচ্ছে...</p>
        ) : points.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '13px', textAlign: 'center', padding: '2rem 0' }}>কোনো পিকআপ পয়েন্ট নেই</p>
        ) : points.map(p => (
          <div key={p.id} style={s.row}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>{p.name}</span>
                {p.area && <span style={{ fontSize: '11px', color: '#818cf8', background: 'rgba(129,140,248,.15)', padding: '2px 8px', borderRadius: '20px' }}>{p.area}</span>}
                <span style={{ fontSize: '11px', color: p.active ? '#22c55e' : '#f87171', background: p.active ? 'rgba(34,197,94,.1)' : 'rgba(248,113,113,.1)', padding: '2px 8px', borderRadius: '20px' }}>
                  {p.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </span>
              </div>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '12px' }}>{p.address}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button onClick={() => handleEdit(p)} style={{ ...s.btn('rgba(129,140,248,.2)'), padding: '7px 12px', color: '#818cf8' }}>✏️</button>
              <button onClick={() => handleToggle(p.id, p.active)} style={{ ...s.btn(p.active ? 'rgba(251,191,36,.1)' : 'rgba(34,197,94,.1)'), padding: '7px 12px', color: p.active ? '#fbbf24' : '#22c55e' }}>
                {p.active ? '⏸' : '▶️'}
              </button>
              <button onClick={() => handleDelete(p.id)} style={{ ...s.btn('rgba(239,68,68,.1)'), padding: '7px 12px', color: '#f87171' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
