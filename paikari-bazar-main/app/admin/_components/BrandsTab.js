'use client';
import { useEffect, useState } from 'react';

const FONT = 'var(--font-hind-siliguri), sans-serif';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: '#0f0e17',
  surface: '#1a1828',
  surfaceHover: '#201e30',
  border: 'rgba(255,255,255,.08)',
  amber: '#f59e0b',
  amberText: '#0f0e17',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,.55)',
  textLabel: 'rgba(255,255,255,.8)',
  red: '#f87171',
  input: '#12111f',
};

const inputStyle = {
  background: C.input,
  border: '1px solid rgba(255,255,255,.15)',
  borderRadius: 10,
  padding: '10px 14px',
  color: C.text,
  fontSize: 15,
  fontFamily: FONT,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          padding: '12px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          fontFamily: FONT, boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          background: t.type === 'success' ? C.amber : C.red,
          color: t.type === 'success' ? C.amberText : '#fff',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

export default function BrandsTab() {
  const [brands, setBrands] = useState([]);
  const [brandName, setBrandName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => { fetchBrands(); }, []);

  const toast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch { toast('লোড ব্যর্থ', 'error'); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (file) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/brands/${fileName}`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': file.type,
        },
        body: file,
      }
    );
    if (!res.ok) throw new Error('Upload failed');
    return `${SUPABASE_URL}/storage/v1/object/public/brands/${fileName}`;
  };

  const handleAdd = async () => {
    if (!brandName.trim()) { toast('ব্র্যান্ডের নাম দিন', 'error'); return; }
    setLoading(true);
    try {
      let logo_url = null;
      if (logoFile) {
        logo_url = await uploadLogo(logoFile);
      }
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandName.trim(), logo_url }),
      });
      if (!res.ok) throw new Error();
      toast('ব্র্যান্ড যোগ হয়েছে ✓');
      setBrandName('');
      setLogoFile(null);
      setLogoPreview('');
      fetchBrands();
    } catch { toast('যোগ করতে ব্যর্থ', 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" মুছবেন?`)) return;
    try {
      const res = await fetch(`/api/brands?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('মুছে ফেলা হয়েছে');
      fetchBrands();
    } catch { toast('মুছতে ব্যর্থ', 'error'); }
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text }}>
      <Toast toasts={toasts} />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.amber, fontFamily: FONT }}>ব্র্যান্ড ব্যবস্থাপনা</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textMuted, fontFamily: FONT }}>{brands.length}টি ব্র্যান্ড মোট</p>
      </div>

      {/* Add Form */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: C.textLabel, fontFamily: FONT }}>নতুন ব্র্যান্ড যোগ</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Brand Name */}
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="ব্র্যান্ডের নাম লিখুন..."
            style={inputStyle}
          />

          {/* Logo Upload */}
          <div>
            <label style={{ fontSize: 13, color: C.textMuted, fontFamily: FONT, display: 'block', marginBottom: 8 }}>
              লোগো আপলোড করুন
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{
                background: C.input, border: '1px dashed rgba(255,255,255,.25)',
                borderRadius: 10, padding: '10px 20px', cursor: 'pointer',
                fontSize: 13, color: C.textMuted, fontFamily: FONT,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                📁 ছবি বেছে নিন
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              {logoPreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={logoPreview}
                    alt="preview"
                    style={{ height: 48, maxWidth: 120, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 4 }}
                  />
                  <button onClick={() => { setLogoFile(null); setLogoPreview(''); }} style={{
                    background: 'rgba(248,113,113,.1)', border: 'none',
                    color: C.red, padding: '4px 10px', borderRadius: 6,
                    fontSize: 12, fontFamily: FONT, cursor: 'pointer',
                  }}>✕ সরান</button>
                </div>
              )}
            </div>
          </div>

          <button onClick={handleAdd} disabled={loading} style={{
            background: loading ? 'rgba(245,158,11,.5)' : C.amber,
            color: C.amberText, border: 'none',
            padding: '10px 24px', borderRadius: 10,
            fontSize: 14, fontWeight: 700, fontFamily: FONT,
            cursor: 'pointer', alignSelf: 'flex-start',
          }}>
            {loading ? 'যোগ হচ্ছে...' : '+ যোগ করুন'}
          </button>
        </div>
      </div>

      {/* Brand List */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.textLabel, fontFamily: FONT }}>সব ব্র্যান্ড</span>
        </div>
        {brands.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: C.textMuted, fontFamily: FONT }}>কোনো ব্র্যান্ড নেই</div>
        ) : (
          brands.map((brand, i) => (
            <div key={brand.id || brand._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: i < brands.length - 1 ? `1px solid ${C.border}` : 'none',
              transition: 'background .15s',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 4 }}
                  />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, background: 'rgba(245,158,11,.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: C.amber, fontWeight: 700, fontFamily: FONT,
                  }}>
                    {brand.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: 15, fontWeight: 500, color: C.text, fontFamily: FONT }}>{brand.name}</span>
              </div>
              <button
                onClick={() => handleDelete(brand.id || brand._id, brand.name)}
                style={{
                  background: 'rgba(248,113,113,.1)', border: 'none',
                  color: C.red, padding: '6px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
                }}
              >মুছুন</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
