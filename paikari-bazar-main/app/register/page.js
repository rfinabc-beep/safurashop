'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function RegisterPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [form, setForm] = useState({
    name: '', shop_name: '', phone: '', district: '', thana: '', address: '', password: '', confirm: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/delivery_areas?active=eq.true&order=district.asc,thana.asc`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const data = await res.json();
        setAreas(Array.isArray(data) ? data : []);
      } catch {}
    };
    loadAreas();
  }, []);

  const districts = [...new Set(areas.map(a => a.district))];
  const thanas = areas.filter(a => a.district === form.district).map(a => a.thana);

  const handleSubmit = async () => {
    setError('');
    if (!form.name) return setError('নাম দিন');
    if (form.phone.length !== 11) return setError('সঠিক ফোন নম্বর দিন');
    if (!form.district) return setError('জেলা বাছুন');
    if (!form.thana) return setError('থানা বাছুন');
    if (!form.address) return setError('ঠিকানা দিন');
    if (form.password.length < 6) return setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর');
    if (form.password !== form.confirm) return setError('পাসওয়ার্ড মিলছে না');

    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          name: form.name,
          shop_name: form.shop_name,
          phone: form.phone,
          district: form.district,
          thana: form.thana,
          address: form.address,
          password: form.password,
          role: 'user',
          status: 'active',
          wallet: 0,
        }),
      });

      if (res.status === 201) {
        router.push('/login');
      } else {
        const err = await res.json();
        if (err.code === '23505') setError('এই ফোন নম্বর আগে ব্যবহার হয়েছে');
        else setError('সমস্যা হয়েছে, আবার চেষ্টা করুন');
      }
    } catch {
      setError('নেটওয়ার্ক সমস্যা');
    }
    setLoading(false);
  };

  const shimmerStyle = {
    background: 'linear-gradient(90deg, #fff 0%, #fff 40%, #e8a020 50%, #fff 60%, #fff 100%)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'shimmer 2.5s linear infinite',
    display: 'inline-block',
  };

  const fieldWrapStyle = {
    display: 'flex',
    alignItems: 'center',
    background: '#161616',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '0 12px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const inputStyle = {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: '14px',
    padding: '11px 0',
    width: '100%',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '6px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  };

  const dividerStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.2)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '20px 0 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeup { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .red-dot { display:inline-block; width:7px; height:7px; background:#ff3b3b; border-radius:50%; margin-left:3px; vertical-align:middle; margin-bottom:3px; animation:blink 1.2s ease-in-out infinite; }
        .fw:focus-within { border-color:#e8a020 !important; box-shadow:0 0 0 3px rgba(232,160,32,0.12) !important; }
        .fade1{opacity:0;animation:fadeup 0.5s ease forwards 0.1s}
        .fade2{opacity:0;animation:fadeup 0.5s ease forwards 0.15s}
        .fade3{opacity:0;animation:fadeup 0.5s ease forwards 0.2s}
        .fade4{opacity:0;animation:fadeup 0.5s ease forwards 0.25s}
        .fade5{opacity:0;animation:fadeup 0.5s ease forwards 0.3s}
        .fade6{opacity:0;animation:fadeup 0.5s ease forwards 0.35s}
        .fade7{opacity:0;animation:fadeup 0.5s ease forwards 0.4s}
        .fade8{opacity:0;animation:fadeup 0.5s ease forwards 0.45s}
        .spinner{width:18px;height:18px;border:2px solid rgba(0,0,0,0.3);border-top-color:#000;border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto;}
        .reg-select {
          width:100%; background:#161616; border:1px solid rgba(255,255,255,0.08);
          border-radius:10px; color:#fff; font-size:14px; padding:11px 14px;
          font-family:inherit; outline:none; cursor:pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .reg-select:focus { border-color:#e8a020; box-shadow:0 0 0 3px rgba(232,160,32,0.12); }
        .reg-select:disabled { opacity:0.4; cursor:not-allowed; }
        .reg-select option { background:#161616; color:#fff; }
        .reg-textarea {
          width:100%; background:#161616; border:1px solid rgba(255,255,255,0.08);
          border-radius:10px; color:#fff; font-size:14px; padding:11px 14px;
          font-family:inherit; outline:none; resize:none; height:72px; line-height:1.6;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .reg-textarea:focus { border-color:#e8a020; box-shadow:0 0 0 3px rgba(232,160,32,0.12); }
        .reg-textarea::placeholder { color:rgba(255,255,255,0.2); }
        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media(max-width:480px) { .two-col { grid-template-columns:1fr; } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', fontFamily: "'Hind Siliguri', sans-serif" }}>

        {/* MOBILE TOP BAR */}
        {isMobile && (
          <div style={{ background: '#000', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
              <span style={{ fontSize: '22px', fontWeight: '800', ...shimmerStyle }}>Aarot</span>
              <span className="red-dot" />
            </div>
            <span onClick={() => router.push('/')} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
              ← হোমে যান
            </span>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>

          {/* LEFT — desktop only */}
          {!isMobile && (
            <div style={{ flex: '0 0 260px', background: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 36px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div onClick={() => router.push('/')} style={{ cursor: 'pointer', marginBottom: '12px' }}>
                <span style={{ fontSize: '28px', fontWeight: '800', ...shimmerStyle }}>Aarot</span>
                <span className="red-dot" />
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' }}>
                সরাসরি সাপ্লায়ার থেকে<br />আপনার দোকানে।
              </p>
            </div>
          )}

          {/* FORM */}
          <div style={{ flex: 1, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', padding: isMobile ? '32px 24px' : '48px', overflowY: 'auto' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>

              {!isMobile && (
                <div className="fade1" onClick={() => router.push('/')} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', cursor: 'pointer', marginBottom: '32px' }}>
                  ← হোমে যান
                </div>
              )}

              <div className="fade1" style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>নতুন অ্যাকাউন্ট</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>আপনার তথ্য দিয়ে নিবন্ধন করুন</div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* ব্যক্তিগত তথ্য */}
              <div style={dividerStyle}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                ব্যক্তিগত তথ্য
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              </div>

              <div className="fade2 two-col" style={{ marginBottom: '12px' }}>
                <div>
                  <div style={labelStyle}>আপনার নাম *</div>
                  <div className="fw" style={fieldWrapStyle}>
                    <input placeholder="রহিম মিয়া" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>দোকানের নাম</div>
                  <div className="fw" style={fieldWrapStyle}>
                    <input placeholder="রহিম স্টোর" value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              </div>

              <div className="fade3" style={{ marginBottom: '12px' }}>
                <div style={labelStyle}>ফোন নম্বর *</div>
                <div className="fw" style={fieldWrapStyle}>
                  <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.3)', marginRight: '8px' }}>📞</span>
                  <input placeholder="01XXXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                </div>
              </div>

              {/* ডেলিভারি ঠিকানা */}
              <div style={dividerStyle}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                ডেলিভারি ঠিকানা
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              </div>

              {areas.length === 0 ? (
                <div className="fade4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#f87171', marginBottom: '12px' }}>
                  ⚠️ এখনো কোনো ডেলিভারি এলাকা সেট করা হয়নি
                </div>
              ) : (
                <div className="fade4 two-col" style={{ marginBottom: '12px' }}>
                  <div>
                    <div style={labelStyle}>জেলা *</div>
                    <select className="reg-select" value={form.district} onChange={e => setForm({ ...form, district: e.target.value, thana: '' })}>
                      <option value="">জেলা বাছুন</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>থানা / উপজেলা *</div>
                    <select className="reg-select" value={form.thana} onChange={e => setForm({ ...form, thana: e.target.value })} disabled={!form.district}>
                      <option value="">থানা বাছুন</option>
                      {thanas.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="fade5" style={{ marginBottom: '12px' }}>
                <div style={labelStyle}>পূর্ণ ঠিকানা *</div>
                <textarea className="reg-textarea" placeholder="বাড়ি নম্বর / রাস্তা / এলাকা" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>

              {/* পাসওয়ার্ড */}
              <div style={dividerStyle}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                পাসওয়ার্ড
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              </div>

              <div className="fade6 two-col" style={{ marginBottom: '20px' }}>
                <div>
                  <div style={labelStyle}>পাসওয়ার্ড *</div>
                  <div className="fw" style={fieldWrapStyle}>
                    <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.3)', marginRight: '8px' }}>🔒</span>
                    <input type="password" placeholder="কমপক্ষে ৬ অক্ষর" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>নিশ্চিত করুন *</div>
                  <div className="fw" style={fieldWrapStyle}>
                    <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.3)', marginRight: '8px' }}>🔒</span>
                    <input type="password" placeholder="আবার লিখুন" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="fade7">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width: '100%', background: '#e8a020', color: '#000', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? <div className="spinner" /> : '✅ নিবন্ধন সম্পন্ন করুন'}
                </button>
              </div>

              <p className="fade8" style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                আগে থেকে অ্যাকাউন্ট আছে?{' '}
                <span onClick={() => router.push('/login')} style={{ color: '#e8a020', fontWeight: '700', cursor: 'pointer' }}>
                  লগইন করুন
                </span>
              </p>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
