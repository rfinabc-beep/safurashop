'use client';
import { useState, useEffect } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const LABELS = {
  standard:  { name: 'স্ট্যান্ডার্ড',    info: '৩-৫ কার্যদিবস' },
  express:   { name: 'এক্সপ্রেস',         info: '১-২ কার্যদিবস' },
  scheduled: { name: 'নির্ধারিত তারিখ',   info: 'তারিখ বেছে নিন' },
  pickup:    { name: 'সেলফ পিকআপ',        info: 'গুদাম থেকে নিন' },
};

export default function DeliveryChargesTab() {
  const [charges, setCharges] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchCharges(); }, []);

  async function fetchCharges() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.delivery_charges&select=value`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
    });
    const data = await res.json();
    if (data[0]) setCharges(data[0].value);
  }

  async function saveCharges() {
    setSaving(true);
    setMsg('');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.delivery_charges`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ value: charges, updated_at: new Date().toISOString() }),
    });
    setSaving(false);
    setMsg(res.ok ? 'সেভ হয়েছে!' : 'সমস্যা হয়েছে');
    setTimeout(() => setMsg(''), 3000);
  }

  const FONT = 'var(--font-hind-siliguri), sans-serif';

  if (!charges) return <p style={{ color: 'rgba(255,255,255,.4)', fontFamily: FONT }}>লোড হচ্ছে...</p>;

  return (
    <div>
      <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', marginBottom: '24px', fontFamily: FONT }}>
        ডেলিভারি চার্জ
      </h2>

      <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.entries(LABELS).map(([key, { name, info }]) => (
          <div key={key} style={{ background: '#1a1828', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', fontFamily: FONT }}>{name}</div>
              <div style={{ color: 'rgba(255,255,255,.35)', fontSize: '12px', fontFamily: FONT }}>{info}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px' }}>৳</span>
              <input
                type="number"
                min="0"
                value={charges[key]}
                onChange={e => setCharges({ ...charges, [key]: Number(e.target.value) })}
                style={{ width: '80px', padding: '8px 10px', background: '#0f0e17', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', color: '#fff', fontSize: '15px', fontWeight: '700', textAlign: 'center', outline: 'none', fontFamily: FONT }}
              />
            </div>
          </div>
        ))}

        <button
          onClick={saveCharges}
          disabled={saving}
          style={{ marginTop: '8px', padding: '13px', background: saving ? '#555' : '#818cf8', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT }}
        >
          {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
        </button>

        {msg && <p style={{ color: msg.includes('সেভ') ? '#22c55e' : '#f87171', fontSize: '13px', textAlign: 'center', fontFamily: FONT }}>{msg}</p>}
      </div>
    </div>
  );
}
