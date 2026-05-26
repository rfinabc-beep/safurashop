'use client';
import { useState, useEffect } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const api = (path, opts = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...opts.headers,
    },
    ...opts,
  });

const FONT = 'var(--font-hind-siliguri), sans-serif';

export default function PagesTab() {
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const fetchPages = async () => {
    setLoading(true);
    const res = await api('pages?order=id.asc');
    const data = await res.json();
    setPages(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, []);

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    await api(`pages?id=eq.${editing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: editing.title,
        content: editing.content,
        updated_at: new Date().toISOString(),
      }),
    });
    setSaving(false);
    setEditing(null);
    showToast('✅ সেভ হয়েছে!');
    fetchPages();
  };

  const slugColor = { about: '#34d399', terms: '#60a5fa', privacy: '#f472b6', contact: '#fbbf24' };

  return (
    <div style={{ fontFamily: FONT, maxWidth: '800px' }}>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: 0 }}>📄 পেজ ম্যানেজমেন্ট</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.35)', margin: '6px 0 0' }}>
          Footer-এর পেজগুলোর কন্টেন্ট এখান থেকে এডিট করুন
        </p>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#1e2a1e', border: '1px solid #34d399', borderRadius: '10px',
          padding: '12px 20px', color: '#34d399', fontSize: '14px', fontWeight: '600',
          fontFamily: FONT, boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        }}>{toast}</div>
      )}

      {loading ? (
        <div style={{ color: 'rgba(255,255,255,.3)', padding: '60px', textAlign: 'center' }}>লোড হচ্ছে...</div>
      ) : (
        pages.map((page) => (
          <div key={page.id} style={{
            background: '#1a1828',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '14px',
          }}>
            {editing?.id === page.id ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <span style={{
                    padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                    background: `${slugColor[page.slug] || '#818cf8'}22`,
                    color: slugColor[page.slug] || '#818cf8',
                  }}>/{page.slug}</span>
                  <span style={{ color: 'rgba(255,255,255,.25)', fontSize: '12px' }}>এডিট করছেন</span>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>টাইটেল</div>
                  <input
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,.05)', border: '1px solid #818cf8',
                      borderRadius: '8px', color: '#fff', fontSize: '14px',
                      padding: '10px 14px', fontFamily: FONT, outline: 'none',
                    }}
                    value={editing.title}
                    onChange={e => setEditing(p => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>কন্টেন্ট</div>
                  <textarea
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,.05)', border: '1px solid #818cf8',
                      borderRadius: '8px', color: '#fff', fontSize: '14px',
                      padding: '10px 14px', fontFamily: FONT, outline: 'none',
                      resize: 'vertical', minHeight: '180px', lineHeight: '1.7',
                    }}
                    value={editing.content}
                    onChange={e => setEditing(p => ({ ...p, content: e.target.value }))}
                    placeholder="পেজের কন্টেন্ট লিখুন..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveEdit} disabled={saving} style={{
                    padding: '9px 20px', borderRadius: '8px', border: 'none',
                    background: 'rgba(129,140,248,.2)', color: '#818cf8',
                    fontSize: '13px', fontWeight: '600', fontFamily: FONT, cursor: 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}>
                    {saving ? 'সেভ হচ্ছে...' : '💾 সেভ করুন'}
                  </button>
                  <button onClick={() => setEditing(null)} style={{
                    padding: '9px 20px', borderRadius: '8px', border: 'none',
                    background: 'rgba(239,68,68,.1)', color: '#f87171',
                    fontSize: '13px', fontWeight: '600', fontFamily: FONT, cursor: 'pointer',
                  }}>
                    বাতিল
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{
                      padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      background: `${slugColor[page.slug] || '#818cf8'}22`,
                      color: slugColor[page.slug] || '#818cf8',
                    }}>/{page.slug}</span>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{page.title}</span>
                  </div>
                  <p style={{
                    fontSize: '13px', color: 'rgba(255,255,255,.3)', margin: 0,
                    lineHeight: '1.6', overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {page.content}
                  </p>
                </div>
                <button onClick={() => setEditing({ ...page })} style={{
                  flexShrink: 0, padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: 'rgba(129,140,248,.12)', color: '#818cf8',
                  fontSize: '12px', fontWeight: '600', fontFamily: FONT, cursor: 'pointer',
                }}>
                  ✏️ এডিট
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
