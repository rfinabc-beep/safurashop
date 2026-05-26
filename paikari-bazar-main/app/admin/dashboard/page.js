'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('সব');
  const [categories, setCategories] = useState(['সব']);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');

  // Auth check
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    const u = JSON.parse(stored);
    if (u.role === 'admin') { router.push('/admin'); return; }
    setUser(u);

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?active=eq.true&order=created_at.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    setProducts(data);
    const cats = ['সব', ...new Set(data.map(p => p.category).filter(Boolean))];
    setCategories(cats);
    setLoading(false);
  };

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const addToCart = (product) => {
    const existing = cart.find(c => c.id === product.id);
    let newCart;
    if (existing) {
      newCart = cart.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
    } else {
      newCart = [...cart, { ...product, qty: 1 }];
    }
    saveCart(newCart);
    showToast(`${product.name} কার্টে যোগ হয়েছে`);
  };

  const updateQty = (id, delta) => {
    const newCart = cart
      .map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0);
    saveCart(newCart);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const filtered = category === 'সব' ? products : products.filter(p => p.category === category);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', fontFamily: 'Hind Siliguri, sans-serif' }}>

      {/* Navbar */}
      <nav style={{
        background: '#0f2442', padding: '0 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: '60px', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>
          পাইকারি<span style={{ color: '#e8a020' }}>বজার</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && (
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
              👋 {user.name || user.phone}
            </span>
          )}
          {/* Cart Button */}
          <button onClick={() => setCartOpen(true)} style={{
            position: 'relative', background: '#e8a020', border: 'none',
            color: '#fff', padding: '8px 16px', borderRadius: '8px',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            🛒 কার্ট
            {cartCount > 0 && (
              <span style={{
                background: '#ef4444', color: '#fff', borderRadius: '50%',
                width: '20px', height: '20px', fontSize: '11px', fontWeight: '800',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{cartCount}</span>
            )}
          </button>
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.8)',
            padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
          }}>লগআউট</button>
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#0f2442', color: '#fff', padding: '12px 24px', borderRadius: '10px',
          fontSize: '14px', fontWeight: '600', zIndex: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>{toast}</div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          {/* Backdrop */}
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          {/* Drawer */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '360px', maxWidth: '100vw',
            background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f2442' }}>🛒 কার্ট ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '60px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
                  <p>কার্ট খালি</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: '1px solid #f3f4f6', gap: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.emoji} {item.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>৳{item.price} × {item.qty}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{
                        width: '28px', height: '28px', borderRadius: '6px', border: '1.5px solid #e5e7eb',
                        background: '#f9fafb', cursor: 'pointer', fontSize: '16px', fontWeight: '700'
                      }}>−</button>
                      <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{
                        width: '28px', height: '28px', borderRadius: '6px', border: '1.5px solid #e5e7eb',
                        background: '#f9fafb', cursor: 'pointer', fontSize: '16px', fontWeight: '700'
                      }}>+</button>
                    </div>
                    <div style={{ fontWeight: '700', color: '#0f2442', minWidth: '60px', textAlign: 'right' }}>
                      ৳{(item.price * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>মোট</span>
                  <span style={{ fontWeight: '800', fontSize: '18px', color: '#0f2442' }}>৳{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={() => { setCartOpen(false); router.push('/checkout'); }} style={{
                  width: '100%', background: '#0f2442', color: '#fff', border: 'none',
                  padding: '14px', borderRadius: '10px', fontSize: '15px',
                  fontWeight: '700', cursor: 'pointer'
                }}>অর্ডার করুন →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #f3f4f6', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '7px 16px', borderRadius: '20px', border: 'none',
              background: category === cat ? '#0f2442' : '#f3f4f6',
              color: category === cat ? '#fff' : '#374151',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              fontFamily: 'Hind Siliguri, sans-serif'
            }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <p>লোড হচ্ছে...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>কোনো পণ্য নেই</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '14px'
          }}>
            {filtered.map(p => {
              const inCart = cart.find(c => c.id === p.id);
              return (
                <div key={p.id} style={{
                  background: '#fff', borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}>
                  {/* Product Image / Emoji */}
                  <div style={{
                    height: '120px', background: '#f9fafb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '48px' }}>{p.emoji || '📦'}</span>
                    }
                  </div>

                  <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.unit}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: 'auto' }}>
                      <span style={{ fontWeight: '800', fontSize: '16px', color: '#0f2442' }}>৳{p.price}</span>
                      {p.mrp && p.mrp > p.price && (
                        <span style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'line-through' }}>৳{p.mrp}</span>
                      )}
                    </div>

                    {inCart ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <button onClick={() => updateQty(p.id, -1)} style={{
                          flex: 1, padding: '7px', borderRadius: '7px', border: '1.5px solid #e5e7eb',
                          background: '#f9fafb', cursor: 'pointer', fontSize: '16px', fontWeight: '700'
                        }}>−</button>
                        <span style={{ fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>{inCart.qty}</span>
                        <button onClick={() => updateQty(p.id, 1)} style={{
                          flex: 1, padding: '7px', borderRadius: '7px', border: 'none',
                          background: '#0f2442', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '700'
                        }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(p)} style={{
                        marginTop: '6px', width: '100%', background: '#0f2442', color: '#fff',
                        border: 'none', padding: '9px', borderRadius: '8px',
                        fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                        fontFamily: 'Hind Siliguri, sans-serif'
                      }}>+ কার্টে যোগ</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
