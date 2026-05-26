'use client';
import { useEffect, useState, useRef } from 'react';

const FONT = 'var(--font-hind-siliguri), sans-serif';

const SUPABASE_URL = 'https://xxqtdlwglpggqafecuka.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cXRkbHdnbHBnZ3FhZmVjdWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDQwODcsImV4cCI6MjA5MjcyMDA4N30.gkqQTxM1n6Jqe-fBrf9RaI1EByJTX7Uv1QvECqzSDDI';

const UNITS = ['Piece', 'Dozen', 'KG', 'Gram', 'Litre', 'ML', 'Sack', 'Packet', 'Carton', 'Box'];

const EMPTY_FORM = {
  name: '', category: '', sub_category: '', cost_price: '', mrp: '', price: '',
  trade_price: '', discount_price: '',
  unit: '', stock: '', moq: '1', max_qty: '',
  image_url: '', description: '', brand: '', sku: '', weight: '', active: true,
};

const C = {
  bg: '#0f0e17',
  surface: '#1a1828',
  surfaceHover: '#201e30',
  border: 'rgba(255,255,255,.08)',
  amber: '#f59e0b',
  amberHover: '#fbbf24',
  amberText: '#0f0e17',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,.55)',
  textLabel: 'rgba(255,255,255,.8)',
  green: '#34d399',
  red: '#f87171',
  input: '#12111f',
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

function Field({ label, children, span }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: span ? `span ${span}` : undefined }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textLabel, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: C.input,
  border: `1px solid rgba(255,255,255,.15)`,
  borderRadius: 10,
  padding: '10px 14px',
  color: C.text,
  fontSize: 15,
  fontFamily: FONT,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

async function uploadToSupabase(file) {
  const ext = file.name.split('.').pop();
  const fileName = `product_${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': file.type,
      'x-upsert': 'true',
    },
    body: file,
  });
  if (!res.ok) throw new Error('Upload failed');
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
}

function ProfitBadge({ cost, selling }) {
  const c = parseFloat(cost);
  const s = parseFloat(selling);
  if (!c || !s) return null;
  const diff = s - c;
  const margin = ((diff / c) * 100).toFixed(1);
  const isProfit = diff >= 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 10, marginTop: 4,
      background: isProfit ? 'rgba(52,211,153,.08)' : 'rgba(248,113,113,.08)',
      border: `1px solid ${isProfit ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)'}`,
    }}>
      <span style={{ fontSize: 16 }}>{isProfit ? '📈' : '📉'}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: isProfit ? C.green : C.red, fontFamily: FONT }}>
        {isProfit ? 'Profit' : 'Loss'}: ৳{Math.abs(diff).toFixed(2)}
      </span>
      <span style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT }}>
        ({isProfit ? '+' : ''}{margin}% margin)
      </span>
    </div>
  );
}

export default function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [toasts, setToasts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchAll(); }, []);

  const toast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, bRes, cRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/brands'),
        fetch(`${SUPABASE_URL}/rest/v1/categories?order=name.asc`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          }
        })
      ]);
      const pData = await pRes.json();
      const bData = await bRes.json();
      const cData = await cRes.json();
      setProducts(pData || []);
      setBrands(bData || []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch { toast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCategoryChange = (e) => {
    const parentId = e.target.value;
    setFormData(p => ({ ...p, category: parentId, sub_category: '' }));
    const subs = categories.filter(c => c.parent_id === parentId);
    setSubCategories(subs);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please select an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5MB', 'error'); return; }
    setUploading(true);
    try {
      const url = await uploadToSupabase(file);
      setFormData((p) => ({ ...p, image_url: url }));
      toast('Image uploaded ✓');
    } catch { toast('Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const removeImage = () => {
    setFormData((p) => ({ ...p, image_url: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setSubCategories([]);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setFormData({
      name: p.name || '', category: p.category || '', sub_category: p.sub_category || '',
      cost_price: p.cost_price || '', mrp: p.mrp || '', price: p.price || '',
      trade_price: p.trade_price || '', discount_price: p.discount_price || '',
      unit: p.unit || '', stock: p.stock || '', moq: p.moq || '1',
      max_qty: p.max_qty || '', image_url: p.image_url || '',
      description: p.description || '', brand: p.brand || '',
      sku: p.sku || '', weight: p.weight || '', active: p.active !== false,
    });
    // load sub-categories for this product's parent category
    if (p.category) {
      const subs = categories.filter(c => c.parent_id === p.category);
      setSubCategories(subs);
    } else {
      setSubCategories([]);
    }
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) { toast('Name and selling price are required', 'error'); return; }
    setSaving(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/products?id=${editId}` : '/api/products';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error();
      toast(editId ? 'Product updated ✓' : 'Product added ✓');
      setShowForm(false); setEditId(null); fetchAll();
    } catch { toast('Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Product deleted'); setConfirmDelete(null); fetchAll();
    } catch { toast('Delete failed', 'error'); }
    finally { setDeleting(null); }
  };

  const toggleActive = async (p) => {
    try {
      const res = await fetch(`/api/products?id=${p.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, active: !p.active }),
      });
      if (!res.ok) throw new Error();
      toast(p.active ? 'Product deactivated' : 'Product activated'); fetchAll();
    } catch { toast('Update failed', 'error'); }
  };

  const parentCategories = categories.filter(c => !c.parent_id);

  const filtered = products.filter((p) => {
    const s = p.name?.toLowerCase().includes(search.toLowerCase());
    const c = filterCat ? p.category === filterCat : true;
    return s && c;
  });

  return (
    <div style={{ fontFamily: FONT, color: C.text, minHeight: '100%' }}>
      <Toast toasts={toasts} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.amber, fontFamily: FONT }}>Product Management</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textMuted, fontFamily: FONT }}>{products.length} products total</p>
        </div>
        <button onClick={openAdd} style={{
          background: C.amber, color: C.amberText, border: 'none',
          padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
          fontFamily: FONT, cursor: 'pointer',
        }}>+ Add New Product</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input placeholder="🔍 Search products..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...inputStyle, width: 200 }}>
          <option value="">All Categories</option>
          {parentCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.amber, fontSize: 24 }}>⏳</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.textMuted, fontFamily: FONT }}>No products found</div>
      ) : (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Product', 'Category', 'Cost', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    textAlign: ['Cost', 'Price', 'Stock'].includes(h) ? 'right' : ['Status', 'Actions'].includes(h) ? 'center' : 'left',
                    fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase',
                    letterSpacing: '0.05em', fontFamily: FONT,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const profit = p.price && p.cost_price ? parseFloat(p.price) - parseFloat(p.cost_price) : null;
                const parentCat = categories.find(c => c.id === p.category);
                const subCat = categories.find(c => c.id === p.sub_category);
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 8, background: C.input,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20, flexShrink: 0, overflow: 'hidden',
                        }}>
                          {p.image_url
                            ? <img src={p.image_url} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover' }} />
                            : '📦'}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT }}>{p.name}</div>
                          {p.unit && <div style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT }}>{p.unit}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, color: C.textMuted, fontFamily: FONT }}>{parentCat?.name || '—'}</div>
                      {subCat && <div style={{ fontSize: 11, color: C.amber, fontFamily: FONT }}>↳ {subCat.name}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ fontSize: 13, color: C.textMuted, fontFamily: FONT }}>{p.cost_price ? `৳${p.cost_price}` : '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.amber, fontFamily: FONT }}>৳{p.price}</div>
                      {p.mrp > 0 && <div style={{ fontSize: 11, color: C.textMuted, textDecoration: 'line-through', fontFamily: FONT }}>৳{p.mrp}</div>}
                      {profit !== null && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: profit >= 0 ? C.green : C.red, fontFamily: FONT }}>
                          {profit >= 0 ? '▲' : '▼'} ৳{Math.abs(profit).toFixed(0)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{
                        fontSize: 14, fontWeight: 600, fontFamily: FONT,
                        color: p.stock > 10 ? C.green : p.stock > 0 ? '#fbbf24' : C.red,
                      }}>{p.stock ?? 0}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button onClick={() => toggleActive(p)} style={{
                        padding: '4px 12px', borderRadius: 20, border: 'none',
                        fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
                        background: p.active ? 'rgba(52,211,153,.12)' : 'rgba(255,255,255,.07)',
                        color: p.active ? C.green : C.textMuted,
                      }}>{p.active ? 'Active' : 'Inactive'}</button>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(p)} style={{
                          background: 'rgba(245,158,11,.1)', border: 'none', color: C.amber,
                          padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                        }}>✏️</button>
                        <button onClick={() => setConfirmDelete(p)} style={{
                          background: 'rgba(248,113,113,.1)', border: 'none', color: C.red,
                          padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                        }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: 24, overflowY: 'auto',
        }}>
          <div style={{
            background: '#1a1828', border: `1px solid rgba(255,255,255,.1)`,
            borderRadius: 16, width: '100%', maxWidth: 680, marginTop: 24, marginBottom: 24,
            boxShadow: '0 20px 60px rgba(0,0,0,.6)',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', borderBottom: `1px solid rgba(255,255,255,.08)`,
            }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.amber, fontFamily: FONT }}>
                {editId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={{
                background: 'none', border: 'none', color: C.textMuted,
                fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0,
              }}>×</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Image Upload */}
              <Field label="Product Photo">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload}
                  style={{ display: 'none' }} />
                {formData.image_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img src={formData.image_url} alt="preview"
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: `1px solid rgba(255,255,255,.15)` }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button onClick={() => fileRef.current?.click()} style={{
                        background: 'rgba(245,158,11,.1)', border: `1px solid rgba(245,158,11,.3)`,
                        color: C.amber, padding: '7px 14px', borderRadius: 8,
                        fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
                      }}>Change Photo</button>
                      <button onClick={removeImage} style={{
                        background: 'rgba(248,113,113,.1)', border: `1px solid rgba(248,113,113,.3)`,
                        color: C.red, padding: '7px 14px', borderRadius: 8,
                        fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
                      }}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                    background: uploading ? 'rgba(245,158,11,.05)' : 'rgba(245,158,11,.08)',
                    border: `2px dashed rgba(245,158,11,.3)`,
                    borderRadius: 12, padding: '20px 0', width: '100%',
                    color: uploading ? C.textMuted : C.amber, fontSize: 14, fontWeight: 600,
                    fontFamily: FONT, cursor: uploading ? 'wait' : 'pointer', textAlign: 'center',
                  }}>
                    {uploading ? '⏳ Uploading...' : '📷 Click to upload photo'}
                  </button>
                )}
              </Field>

              {/* Name */}
              <Field label="Product Name *">
                <input name="name" value={formData.name} onChange={handleChange}
                  placeholder="e.g. Masur Dal" style={inputStyle} />
              </Field>

              {/* Category + Sub Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Category">
                  <select name="category" value={formData.category} onChange={handleCategoryChange} style={inputStyle}>
                    <option value="">Select category</option>
                    {parentCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Sub Category">
                  <select
                    name="sub_category"
                    value={formData.sub_category}
                    onChange={handleChange}
                    disabled={subCategories.length === 0}
                    style={{
                      ...inputStyle,
                      opacity: subCategories.length === 0 ? 0.5 : 1,
                      cursor: subCategories.length === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="">
                      {subCategories.length === 0 ? 'আগে category বেছে নিন' : 'Select sub-category'}
                    </option>
                    {subCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Unit */}
              <Field label="Unit">
                <select name="unit" value={formData.unit} onChange={handleChange} style={inputStyle}>
                  <option value="">Select unit</option>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>

              {/* Price Section */}
              <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 16, border: `1px solid rgba(255,255,255,.06)` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
                  💰 Pricing
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <Field label="Cost Price">
                    <input type="number" name="cost_price" value={formData.cost_price}
                      onChange={handleChange} placeholder="0" style={inputStyle} />
                  </Field>
                  <Field label="MRP">
                    <input type="number" name="mrp" value={formData.mrp}
                      onChange={handleChange} placeholder="0" style={inputStyle} />
                  </Field>
                  <Field label="Selling Price *">
                    <input type="number" name="price" value={formData.price}
                      onChange={handleChange} placeholder="0" style={{ ...inputStyle, border: `1px solid rgba(245,158,11,.35)` }} />
                  </Field>
                  <Field label="Trade Price">
                    <input type="number" name="trade_price" value={formData.trade_price}
                      onChange={handleChange} placeholder="0" style={inputStyle} />
                  </Field>
                  <Field label="Discount Price">
                    <input type="number" name="discount_price" value={formData.discount_price}
                      onChange={handleChange} placeholder="0" style={inputStyle} />
                  </Field>
                </div>
                <ProfitBadge cost={formData.cost_price} selling={formData.price} />
              </div>

              {/* Stock / MOQ / MaxQty */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Field label="Stock">
                  <input type="number" name="stock" value={formData.stock}
                    onChange={handleChange} placeholder="0" style={inputStyle} />
                </Field>
                <Field label="Min Order (MOQ)">
                  <input type="number" name="moq" value={formData.moq}
                    onChange={handleChange} placeholder="1" style={inputStyle} />
                </Field>
                <Field label="Max Quantity">
                  <input type="number" name="max_qty" value={formData.max_qty}
                    onChange={handleChange} placeholder="0" style={inputStyle} />
                </Field>
              </div>

              {/* Brand / SKU / Weight */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Field label="Brand">
                  <select name="brand" value={formData.brand} onChange={handleChange} style={inputStyle}>
                    <option value="">Select brand</option>
                    {brands.map((b) => <option key={b._id || b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </Field>
                <Field label="SKU">
                  <input name="sku" value={formData.sku} onChange={handleChange}
                    placeholder="SKU-001" style={inputStyle} />
                </Field>
                <Field label="Weight">
                  <input name="weight" value={formData.weight} onChange={handleChange}
                    placeholder="500g" style={inputStyle} />
                </Field>
              </div>

              {/* Description */}
              <Field label="Description">
                <textarea name="description" value={formData.description} onChange={handleChange}
                  rows={3} placeholder="Write product description..."
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>

              {/* Active toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div onClick={() => setFormData((p) => ({ ...p, active: !p.active }))} style={{
                  width: 44, height: 24, borderRadius: 12, position: 'relative',
                  background: formData.active ? C.amber : 'rgba(255,255,255,.15)',
                  transition: 'background .2s', cursor: 'pointer',
                }}>
                  <div style={{
                    position: 'absolute', top: 3, left: formData.active ? 22 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)',
                  }} />
                </div>
                <span style={{ fontSize: 14, color: C.textLabel, fontFamily: FONT }}>Keep product active</span>
              </label>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex', gap: 12, padding: '16px 24px',
              borderTop: `1px solid rgba(255,255,255,.08)`,
            }}>
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={{
                flex: 1, padding: '11px 0', borderRadius: 10,
                border: `1px solid rgba(255,255,255,.15)`, background: 'none',
                color: C.textMuted, fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} style={{
                flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                background: saving ? 'rgba(245,158,11,.5)' : C.amber,
                color: C.amberText, fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'pointer',
              }}>
                {saving ? 'Saving...' : editId ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: '#1a1828', border: '1px solid rgba(248,113,113,.3)',
            borderRadius: 16, padding: 28, maxWidth: 360, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,.6)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: C.text, fontFamily: FONT }}>Delete Product?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: C.textMuted, fontFamily: FONT }}>
              "{confirmDelete.name}" will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                border: `1px solid rgba(255,255,255,.15)`, background: 'none',
                color: C.textMuted, fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} disabled={deleting === confirmDelete.id} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                background: C.red, color: '#fff', fontSize: 14, fontWeight: 700,
                fontFamily: FONT, cursor: 'pointer', opacity: deleting === confirmDelete.id ? 0.6 : 1,
              }}>
                {deleting === confirmDelete.id ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
