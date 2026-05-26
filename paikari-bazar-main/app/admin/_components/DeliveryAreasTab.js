'use client';
import { useState, useEffect } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const FONT = 'var(--font-hind-siliguri), sans-serif';

export default function DeliveryAreasTab() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add form state
  const [newDistrict, setNewDistrict] = useState('');
  const [newThana, setNewThana] = useState('');

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editDistrict, setEditDistrict] = useState('');
  const [editThana, setEditThana] = useState('');

  // Filter
  const [filterDistrict, setFilterDistrict] = useState('');

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/delivery_areas?order=district.asc,thana.asc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const data = await res.json();
      setAreas(Array.isArray(data) ? data : []);
    } catch {
      setError('ডেটা লোড করতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAreas(); }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAdd = async () => {
    if (!newDistrict.trim()) return setError('জেলার নাম দিন');
    if (!newThana.trim()) return setError('থানার নাম দিন');
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/delivery_areas`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ district: newDistrict.trim(), thana: newThana.trim(), active: true }),
      });
      if (res.ok) {
        setNewDistrict('');
        setNewThana('');
        showSuccess('✅ নতুন এলাকা যোগ হয়েছে');
        fetchAreas();
      } else {
        setError('যোগ করতে সমস্যা হয়েছে');
      }
    } catch {
      setError('নেটওয়ার্ক সমস্যা');
    }
    setSaving(false);
  };

  const handleToggle = async (id, currentActive) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/delivery_areas?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentActive }),
      });
      setAreas(prev => prev.map(a => a.id === id ? { ...a, active: !currentActive } : a));
    } catch {
      setError('আপডেট করতে সমস্যা হয়েছে');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('এই এলাকা মুছে ফেলবেন?')) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/delivery_areas?id=eq.${id}`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      setAreas(prev => prev.filter(a => a.id !== id));
      showSuccess('🗑️ এলাকা মুছে ফেলা হয়েছে');
    } catch {
      setError('মুছতে সমস্যা হয়েছে');
    }
  };

  const startEdit = (area) => {
    setEditId(area.id);
    setEditDistrict(area.district);
    setEditThana(area.thana);
  };

  const handleEditSave = async () => {
    if (!editDistrict.trim() || !editThana.trim()) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/delivery_areas?id=eq.${editId}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ district: editDistrict.trim(), thana: editThana.trim() }),
      });
      setAreas(prev => prev.map(a => a.id === editId ? { ...a, district: editDistrict.trim(), thana: editThana.trim() } : a));
      setEditId(null);
      showSuccess('✏️ এলাকা আপডেট হয়েছে');
    } catch {
      setError('আপডেট করতে সমস্যা হয়েছে');
    }
  };

  const districts = [...new Set(areas.map(a => a.district))];
  const filtered = filterDistrict ? areas.filter(a => a.district === filterDistrict) : areas;

  const inputStyle = {
    background: '#1a1828',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    padding: '9px 12px',
    fontFamily: FONT,
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: 0 }}>🗺️ ডেলিভারি এলাকা</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
          {areas.length} টি এলাকা · {areas.filter(a => a.active).length} টি সক্রিয়
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
          ⚠️ {error}
          <span onClick={() => setError('')} style={{ float: 'right', cursor: 'pointer', opacity: 0.6 }}>✕</span>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#4ade80', fontSize: '13px', marginBottom: '16px' }}>
          {success}
        </div>
      )}

      {/* Add New Area */}
      <div style={{ background: '#1a1828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#818cf8', marginBottom: '14px' }}>➕ নতুন এলাকা যোগ করুন</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>জেলা *</div>
            <input
              style={inputStyle}
              placeholder="যেমন: ঢাকা"
              value={newDistrict}
              onChange={e => setNewDistrict(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#818cf8'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>থানা / উপজেলা *</div>
            <input
              style={inputStyle}
              placeholder="যেমন: মিরপুর"
              value={newThana}
              onChange={e => setNewThana(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              onFocus={e => e.target.style.borderColor = '#818cf8'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            style={{
              background: '#818cf8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: FONT,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {saving ? '...' : '+ যোগ করুন'}
          </button>
        </div>
      </div>

      {/* Filter by District */}
      {districts.length > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>ফিল্টার:</span>
          <button
            onClick={() => setFilterDistrict('')}
            style={{
              padding: '5px 12px', borderRadius: '20px', border: 'none',
              background: !filterDistrict ? '#818cf8' : 'rgba(255,255,255,0.07)',
              color: !filterDistrict ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: '12px', fontFamily: FONT, cursor: 'pointer',
            }}
          >সব</button>
          {districts.map(d => (
            <button key={d}
              onClick={() => setFilterDistrict(d)}
              style={{
                padding: '5px 12px', borderRadius: '20px', border: 'none',
                background: filterDistrict === d ? '#818cf8' : 'rgba(255,255,255,0.07)',
                color: filterDistrict === d ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: '12px', fontFamily: FONT, cursor: 'pointer',
              }}
            >{d}</button>
          ))}
        </div>
      )}

      {/* Areas Table */}
      <div style={{ background: '#1a1828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 120px', padding: '12px 20px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['জেলা', 'থানা / উপজেলা', 'স্ট্যাটাস', 'অ্যাকশন'].map(h => (
            <div key={h} style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>কোনো এলাকা নেই</div>
        ) : (
          filtered.map((area, i) => (
            <div key={area.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 100px 120px',
              padding: '12px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              alignItems: 'center',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
            }}>
              {/* District */}
              <div>
                {editId === area.id ? (
                  <input
                    style={{ ...inputStyle, padding: '6px 10px', fontSize: '13px' }}
                    value={editDistrict}
                    onChange={e => setEditDistrict(e.target.value)}
                  />
                ) : (
                  <span style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>{area.district}</span>
                )}
              </div>

              {/* Thana */}
              <div>
                {editId === area.id ? (
                  <input
                    style={{ ...inputStyle, padding: '6px 10px', fontSize: '13px' }}
                    value={editThana}
                    onChange={e => setEditThana(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEditSave()}
                  />
                ) : (
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{area.thana}</span>
                )}
              </div>

              {/* Status Toggle */}
              <div>
                <button
                  onClick={() => handleToggle(area.id, area.active)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    background: area.active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: area.active ? '#4ade80' : '#f87171',
                    fontSize: '11px',
                    fontWeight: '600',
                    fontFamily: FONT,
                    cursor: 'pointer',
                  }}
                >
                  {area.active ? '● সক্রিয়' : '○ বন্ধ'}
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {editId === area.id ? (
                  <>
                    <button onClick={handleEditSave} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>✓ সেভ</button>
                    <button onClick={() => setEditId(null)} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>✕</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(area)} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'rgba(129,140,248,0.15)', color: '#818cf8', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>✏️</button>
                    <button onClick={() => handleDelete(area.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>🗑️</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {areas.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            মোট জেলা: <span style={{ color: '#818cf8', fontWeight: '600' }}>{districts.length}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            মোট থানা: <span style={{ color: '#818cf8', fontWeight: '600' }}>{areas.length}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            সক্রিয়: <span style={{ color: '#4ade80', fontWeight: '600' }}>{areas.filter(a => a.active).length}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            বন্ধ: <span style={{ color: '#f87171', fontWeight: '600' }}>{areas.filter(a => !a.active).length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
