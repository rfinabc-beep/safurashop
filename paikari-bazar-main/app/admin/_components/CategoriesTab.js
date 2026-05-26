'use client';
import { useState, useEffect } from 'react';
import { SUPABASE_URL, SUPABASE_KEY, headers, s } from './constants';

const inp = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  fontFamily: 'Hind Siliguri, sans-serif',
  color: '#111827',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

const IMG_SIZE = 44;

export default function CategoriesTab() {
  const [parents, setParents] = useState([]);
  const [subs, setSubs] = useState([]);
  const [msg, setMsg] = useState('');

  // Add parent form
  const [parentForm, setParentForm] = useState({ name: '' });
  const [parentImg, setParentImg] = useState(null);
  const [parentPreview, setParentPreview] = useState(null);
  const [parentLoading, setParentLoading] = useState(false);

  // Add sub form
  const [subForm, setSubForm] = useState({ name: '', parent_id: '' });
  const [subImg, setSubImg] = useState(null);
  const [subPreview, setSubPreview] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  // Edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '' });
  const [editImg, setEditImg] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?order=created_at.asc`, { headers });
    const data = await res.json();
    if (!Array.isArray(data)) return;
    setParents(data.filter(c => !c.parent_id));
    setSubs(data.filter(c => !!c.parent_id));
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fileName = `cat_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/category-images/${fileName}`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
      body: file,
    });
    if (!res.ok) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/category-images/${fileName}`;
  };

  // --- Add Parent ---
  const addParent = async () => {
    if (!parentForm.name) { setMsg('❌ ক্যাটাগরির নাম দিন'); return; }
    setParentLoading(true);
    const image_url = await uploadImage(parentImg);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ name: parentForm.name, image_url, parent_id: null }),
    });
    setParentLoading(false);
    if (res.status === 201) {
      setMsg('✅ ক্যাটাগরি যোগ হয়েছে');
      setParentForm({ name: '' });
      setParentImg(null); setParentPreview(null);
      loadAll();
    } else { setMsg('❌ সমস্যা হয়েছে'); }
  };

  // --- Add Sub ---
  const addSub = async () => {
    if (!subForm.name) { setMsg('❌ সাব-ক্যাটাগরির নাম দিন'); return; }
    if (!subForm.parent_id) { setMsg('❌ প্যারেন্ট ক্যাটাগরি বেছে নিন'); return; }
    setSubLoading(true);
    const image_url = await uploadImage(subImg);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ name: subForm.name, image_url, parent_id: subForm.parent_id }),
    });
    setSubLoading(false);
    if (res.status === 201) {
      setMsg('✅ সাব-ক্যাটাগরি যোগ হয়েছে');
      setSubForm({ name: '', parent_id: '' });
      setSubImg(null); setSubPreview(null);
      loadAll();
    } else { setMsg('❌ সমস্যা হয়েছে'); }
  };

  // --- Edit ---
  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name });
    setEditImg(null);
    setEditPreview(cat.image_url || null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '' });
    setEditImg(null);
    setEditPreview(null);
  };

  const saveEdit = async (cat) => {
    if (!editForm.name) return;
    setEditLoading(true);
    let image_url = cat.image_url;
    if (editImg) {
      const uploaded = await uploadImage(editImg);
      if (uploaded) image_url = uploaded;
    }
    await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${cat.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ name: editForm.name, image_url }),
    });
    setEditLoading(false);
    cancelEdit();
    loadAll();
    setMsg('✅ আপডেট হয়েছে');
  };

  const deleteCategory = async (id) => {
    if (!confirm('এই ক্যাটাগরি মুছে ফেলবেন?')) return;
    await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${id}`, { method: 'DELETE', headers });
    loadAll();
  };

  const imgBox = (url) => (
    url
      ? <img src={url} alt="" style={{ width: IMG_SIZE, height: IMG_SIZE, objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', flexShrink: 0 }} />
      : <div style={{ width: IMG_SIZE, height: IMG_SIZE, borderRadius: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb', flexShrink: 0 }} />
  );

  const imagePickerLabel = (preview, onChange, label = 'ছবি') => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {preview && <img src={preview} alt="preview" style={{ width: IMG_SIZE, height: IMG_SIZE, objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f3f4f6', border: '2px dashed #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>
        📷 {label}
        <input type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
      </label>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1e1b4b' }}>ক্যাটাগরি ব্যবস্থাপনা</h2>

      {msg && (
        <div style={{ background: msg.includes('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.includes('✅') ? '#bbf7d0' : '#fecaca'}`, color: msg.includes('✅') ? '#16a34a' : '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

        {/* Add Parent Category */}
        <div style={s.card}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px', color: '#1e1b4b' }}>নতুন ক্যাটাগরি</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px', color: '#374151' }}>নাম *</label>
            <input style={inp} placeholder="যেমন: Grocery, Oil..." value={parentForm.name} onChange={e => setParentForm({ name: e.target.value })} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>ছবি</label>
            {imagePickerLabel(parentPreview, e => { const f = e.target.files[0]; if (f) { setParentImg(f); setParentPreview(URL.createObjectURL(f)); } })}
          </div>
          <button style={{ ...s.btn, background: '#059669', opacity: parentLoading ? 0.7 : 1 }} onClick={addParent} disabled={parentLoading}>
            {parentLoading ? 'যোগ হচ্ছে...' : '+ ক্যাটাগরি যোগ করুন'}
          </button>
        </div>

        {/* Add Sub-Category */}
        <div style={s.card}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px', color: '#1e1b4b' }}>নতুন সাব-ক্যাটাগরি</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px', color: '#374151' }}>প্যারেন্ট ক্যাটাগরি *</label>
            <select style={inp} value={subForm.parent_id} onChange={e => setSubForm({ ...subForm, parent_id: e.target.value })}>
              <option value="">-- বেছে নিন --</option>
              {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px', color: '#374151' }}>সাব-ক্যাটাগরি নাম *</label>
            <input style={inp} placeholder="যেমন: Rice, Lentil..." value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>ছবি</label>
            {imagePickerLabel(subPreview, e => { const f = e.target.files[0]; if (f) { setSubImg(f); setSubPreview(URL.createObjectURL(f)); } })}
          </div>
          <button style={{ ...s.btn, opacity: subLoading ? 0.7 : 1 }} onClick={addSub} disabled={subLoading}>
            {subLoading ? 'যোগ হচ্ছে...' : '+ সাব-ক্যাটাগরি যোগ করুন'}
          </button>
        </div>
      </div>

      {/* Category List */}
      <div style={s.card}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#1e1b4b' }}>
          ক্যাটাগরি তালিকা ({parents.length} ক্যাটাগরি, {subs.length} সাব-ক্যাটাগরি)
        </h3>

        {parents.length === 0 && <p style={{ color: '#6b7280', fontSize: '13px' }}>কোনো ক্যাটাগরি নেই</p>}

        {parents.map(cat => {
          const catSubs = subs.filter(sc => sc.parent_id === cat.id);
          return (
            <div key={cat.id} style={{ marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>

              {/* Parent Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {editingId === cat.id
                    ? <img src={editPreview || cat.image_url} alt="" style={{ width: IMG_SIZE, height: IMG_SIZE, objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    : imgBox(cat.image_url)
                  }
                  {editingId === cat.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input style={{ ...inp, width: '180px', padding: '6px 10px', fontSize: '13px' }} value={editForm.name} onChange={e => setEditForm({ name: e.target.value })} />
                      <label style={{ fontSize: '11px', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline' }}>
                        📷 ছবি পরিবর্তন
                        <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setEditImg(f); setEditPreview(URL.createObjectURL(f)); } }} style={{ display: 'none' }} />
                      </label>
                    </div>
                  ) : (
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e1b4b' }}>{cat.name}</span>
                  )}
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>({catSubs.length} সাব)</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {editingId === cat.id ? (
                    <>
                      <button onClick={() => saveEdit(cat)} disabled={editLoading} style={{ ...s.btn, background: '#059669', padding: '5px 12px', fontSize: '12px', opacity: editLoading ? 0.7 : 1 }}>
                        {editLoading ? '...' : '✅ সেভ'}
                      </button>
                      <button onClick={cancelEdit} style={{ ...s.btn, background: '#f3f4f6', color: '#374151', padding: '5px 12px', fontSize: '12px' }}>
                        বাতিল
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(cat)} style={{ ...s.btn, background: '#ede9fe', color: '#6d28d9', padding: '5px 12px', fontSize: '12px' }}>✏️</button>
                      <button onClick={() => deleteCategory(cat.id)} style={{ ...s.btn, background: '#fee2e2', color: '#dc2626', padding: '5px 12px', fontSize: '12px' }}>🗑</button>
                    </>
                  )}
                </div>
              </div>

              {/* Sub-category Rows */}
              {catSubs.length > 0 && (
                <div style={{ padding: '8px 14px 10px 14px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#fff' }}>
                  {catSubs.map(sc => (
                    <div key={sc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#d1d5db', fontSize: '12px' }}>└</span>
                        {editingId === sc.id
                          ? <img src={editPreview || sc.image_url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                          : sc.image_url
                            ? <img src={sc.image_url} alt={sc.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                            : <div style={{ width: 36, height: 36, borderRadius: '6px', background: '#f3f4f6', border: '1px solid #e5e7eb' }} />
                        }
                        {editingId === sc.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <input style={{ ...inp, width: '160px', padding: '5px 8px', fontSize: '13px' }} value={editForm.name} onChange={e => setEditForm({ name: e.target.value })} />
                            <label style={{ fontSize: '11px', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline' }}>
                              📷 ছবি পরিবর্তন
                              <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setEditImg(f); setEditPreview(URL.createObjectURL(f)); } }} style={{ display: 'none' }} />
                            </label>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#374151' }}>{sc.name}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {editingId === sc.id ? (
                          <>
                            <button onClick={() => saveEdit(sc)} disabled={editLoading} style={{ ...s.btn, background: '#059669', padding: '4px 10px', fontSize: '11px', opacity: editLoading ? 0.7 : 1 }}>
                              {editLoading ? '...' : '✅'}
                            </button>
                            <button onClick={cancelEdit} style={{ ...s.btn, background: '#f3f4f6', color: '#374151', padding: '4px 10px', fontSize: '11px' }}>✕</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(sc)} style={{ ...s.btn, background: '#ede9fe', color: '#6d28d9', padding: '4px 10px', fontSize: '11px' }}>✏️</button>
                            <button onClick={() => deleteCategory(sc.id)} style={{ ...s.btn, background: '#fee2e2', color: '#dc2626', padding: '4px 10px', fontSize: '11px' }}>🗑</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
