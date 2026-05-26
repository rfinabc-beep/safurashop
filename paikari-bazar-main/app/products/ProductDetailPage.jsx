'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
const saveCart = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdated'));
};

export default function ProductDetailPage() {
  const router  = useRouter();
  const params  = useParams();
  const id      = params?.id;

  const [product, setProduct]   = useState(null);
  const [related, setRelated]   = useState([]);
  const [brand, setBrand]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [cartQty, setCartQty]   = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [imgError, setImgError] = useState(false);

  const syncCart = useCallback(() => {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    setCartQty(item?.quantity || 0);
    let total = 0, count = 0;
    cart.forEach(i => { total += (i.price || 0) * i.quantity; count += i.quantity; });
    setCartTotal(total);
    setCartCount(count);
  }, [id]);

  useEffect(() => {
    syncCart();
    window.addEventListener('cartUpdated', syncCart);
    return () => window.removeEventListener('cartUpdated', syncCart);
  }, [syncCart]);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        // Fetch product
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/products?id=eq.${id}&select=*`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) { setLoading(false); return; }
        const prod = data[0];
        setProduct(prod);

        // Fetch related (same category, exclude self)
        if (prod.category) {
          const relRes = await fetch(
            `${SUPABASE_URL}/rest/v1/products?category=eq.${encodeURIComponent(prod.category)}&id=neq.${id}&select=*&limit=8`,
            { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
          );
          const relData = await relRes.json();
          if (Array.isArray(relData)) setRelated(relData);
        }

        // Fetch brand
        if (prod.brand_id) {
          const brRes = await fetch(`/api/brands`);
          const brands = await brRes.json();
          if (Array.isArray(brands)) {
            setBrand(brands.find(b => b.id === prod.brand_id) || null);
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    const minQty = product.min_order ? parseInt(product.min_order) : 1;
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === product.id);
    if (idx === -1) { cart.push({ ...product, quantity: minQty }); }
    else { cart[idx].quantity += 1; }
    saveCart(cart);
  };

  const handleIncrease = () => {
    if (!product) return;
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === product.id);
    if (idx !== -1) { cart[idx].quantity += 1; saveCart(cart); }
  };

  const handleDecrease = () => {
    if (!product) return;
    const minQty = product.min_order ? parseInt(product.min_order) : 1;
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === product.id);
    if (idx === -1) return;
    if (cart[idx].quantity <= minQty) { cart.splice(idx, 1); }
    else { cart[idx].quantity -= 1; }
    saveCart(cart);
  };

  const discount   = product?.mrp && product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : null;
  const outOfStock = product?.stock !== undefined && product?.stock !== null && product.stock <= 0;
  const minQty     = product?.min_order ? parseInt(product.min_order) : 1;
  const inCart     = cartQty > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { font-family: 'Hind Siliguri', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .back-btn { background: #fff; border: 1.5px solid #ebebeb; border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 600; color: #555; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s; font-family: 'Hind Siliguri', sans-serif; }
        .back-btn:hover { border-color: #ff6a00; color: #ff6a00; }
        .qty-btn { border: none; cursor: pointer; font-weight: 800; font-size: 22px; display: flex; align-items: center; justify-content: center; background: none; color: #fff; transition: transform 0.15s; font-family: 'Hind Siliguri', sans-serif; }
        .qty-btn:active { transform: scale(0.82); }
        .rel-card { background: #fff; border-radius: 12px; border: 1.5px solid #ebebeb; overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; flex-shrink: 0; }
        .rel-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(255,106,0,0.12); border-color: #ffcfaa; }
        .rel-img { width: 100%; height: 120px; object-fit: cover; display: block; transition: transform 0.3s; }
        .rel-card:hover .rel-img { transform: scale(1.05); }
        .float-bar { animation: slideUp 0.3s cubic-bezier(.4,0,.2,1) forwards; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 90 }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #ebebeb', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="back-btn" onClick={() => router.back()}>
            <span style={{ fontSize: 16 }}>←</span> পিছনে
          </button>
          {cartCount > 0 && (
            <button onClick={() => router.push('/cart')} style={{ background: '#fff5f0', border: '1.5px solid #ffcfaa', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: '#ff6a00', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Hind Siliguri, sans-serif' }}>
              🛒 <span>{cartCount}টি</span> <span>· ৳{cartTotal.toLocaleString('bn-BD')}</span>
            </button>
          )}
        </div>

        {loading ? (
          /* Skeleton */
          <div style={{ maxWidth: 680, margin: '0 auto', padding: 16, animation: 'fadeUp 0.3s ease' }}>
            <div style={{ height: 320, background: 'linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 16, marginBottom: 16 }} />
            <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
              <div style={{ height: 20, background: 'linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 6, marginBottom: 12 }} />
              <div style={{ height: 14, width: '50%', background: 'linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 6, marginBottom: 20 }} />
              <div style={{ height: 48, background: 'linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 12 }} />
            </div>
          </div>
        ) : !product ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#555', marginBottom: 8 }}>পণ্য পাওয়া যায়নি</p>
            <button onClick={() => router.push('/products')} style={{ background: '#ff6a00', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif', marginTop: 8 }}>সব পণ্য দেখুন</button>
          </div>
        ) : (
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 0', animation: 'fadeUp 0.35s ease' }}>

            {/* Product Image */}
            <div style={{ borderRadius: 18, overflow: 'hidden', background: '#fff', marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', position: 'relative' }}>
              {!imgError && product.image_url ? (
                <img src={product.image_url} alt={product.name} onError={() => setImgError(true)} style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block', padding: 20 }} />
              ) : (
                <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg,#fafafa,#f0f0f0)' }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d0d0d0" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  <span style={{ fontSize: 12, color: '#ccc', fontWeight: 600 }}>ছবি নেই</span>
                </div>
              )}
              {discount && !outOfStock && (
                <span style={{ position: 'absolute', top: 14, right: 14, background: 'linear-gradient(135deg,#ef4444,#f87171)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>-{discount}%</span>
              )}
              {outOfStock && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 800, padding: '8px 20px', borderRadius: 20 }}>স্টক শেষ</span>
                </div>
              )}
            </div>

            {/* Product Info Card */}
            <div style={{ background: '#fff', borderRadius: 18, padding: '18px 18px 20px', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              {/* Brand + Category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {brand && (
                  <span style={{ fontSize: 11, background: '#f5f5f5', color: '#666', padding: '3px 10px', borderRadius: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {brand.logo_url && <img src={brand.logo_url} alt={brand.name} style={{ height: 14, width: 'auto', objectFit: 'contain' }} />}
                    {brand.name}
                  </span>
                )}
                {product.category && (
                  <span style={{ fontSize: 11, background: '#fff5f0', color: '#ff6a00', padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid #ffcfaa' }}>{product.category}</span>
                )}
              </div>

              {/* Name */}
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 12 }}>{product.name}</h1>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: minQty > 1 ? 8 : 16 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: outOfStock ? '#aaa' : '#ff6a00' }}>৳{product.price?.toLocaleString('bn-BD')}</span>
                {product.mrp && product.mrp > product.price && (
                  <span style={{ fontSize: 15, color: '#bbb', textDecoration: 'line-through', fontWeight: 500 }}>৳{product.mrp?.toLocaleString('bn-BD')}</span>
                )}
                {discount && <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>{discount}% ছাড়</span>}
              </div>

              {/* Min order notice */}
              {minQty > 1 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>সর্বনিম্ন অর্ডার: {minQty}টি</span>
                </div>
              )}

              {/* Cart action */}
              {outOfStock ? (
                <div style={{ background: '#f3f4f6', borderRadius: 14, padding: '14px', textAlign: 'center', color: '#aaa', fontWeight: 700, fontSize: 14 }}>স্টক শেষ হয়ে গেছে</div>
              ) : inCart ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg,#ff6a00,#ff8c38)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 14px rgba(255,106,0,0.28)', flex: 1 }}>
                    <button className="qty-btn" onClick={handleDecrease} style={{ width: 52, height: 48 }}>−</button>
                    <span style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 17 }}>{cartQty}</span>
                    <button className="qty-btn" onClick={handleIncrease} style={{ width: 52, height: 48 }}>+</button>
                  </div>
                  <button onClick={() => router.push('/cart')} style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 14, height: 48, padding: '0 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Hind Siliguri, sans-serif', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                    কার্ট দেখুন →
                  </button>
                </div>
              ) : (
                <button onClick={handleAdd} style={{ width: '100%', background: 'linear-gradient(135deg,#ff6a00,#ff8c38)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(255,106,0,0.28)', fontFamily: 'Hind Siliguri, sans-serif' }}>
                  <span>🛒</span> কার্টে যোগ করুন
                </button>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div style={{ background: '#fff', borderRadius: 18, padding: '18px 18px 20px', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📋</span> বিস্তারিত
                </h2>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{product.description}</p>
              </div>
            )}

            {/* Extra Details */}
            {(product.sku || product.weight || product.unit || brand) && (
              <div style={{ background: '#fff', borderRadius: 18, padding: '18px 18px 20px', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>ℹ️</span> তথ্য
                </h2>
                {[
                  brand         && ['ব্র্যান্ড', brand.name],
                  product.category && ['ক্যাটাগরি', product.category],
                  product.sku   && ['SKU', product.sku],
                  product.weight && ['ওজন', product.weight],
                  product.unit  && ['ইউনিট', product.unit],
                  minQty > 1    && ['সর্বনিম্ন অর্ডার', `${minQty}টি`],
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Related Products */}
            {related.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🔗</span> একই ক্যাটাগরির পণ্য
                </h2>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                  {related.map(rel => {
                    const relDiscount = rel.mrp && rel.mrp > rel.price ? Math.round((1 - rel.price / rel.mrp) * 100) : null;
                    return (
                      <div key={rel.id} className="rel-card" onClick={() => router.push(`/products/${rel.id}`)} style={{ width: 150, minWidth: 150 }}>
                        <div style={{ height: 120, background: '#f8f8f8', position: 'relative', overflow: 'hidden' }}>
                          {rel.image_url
                            ? <img src={rel.image_url} alt={rel.name} className="rel-img" loading="lazy" />
                            : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#fafafa,#f0f0f0)' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d0d0d0" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                              </div>
                          }
                          {relDiscount && (
                            <span style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 20 }}>-{relDiscount}%</span>
                          )}
                        </div>
                        <div style={{ padding: '8px 10px 10px' }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4, marginBottom: 5, minHeight: 34 }}>{rel.name}</p>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#ff6a00' }}>৳{rel.price?.toLocaleString('bn-BD')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Cart Bar */}
        {cartCount > 0 && !loading && product && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150, padding: '10px 16px 20px', background: 'linear-gradient(to top, #fff 60%, transparent)' }}>
            <button className="float-bar" onClick={() => router.push('/cart')}
              style={{ width: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', background: 'linear-gradient(135deg,#ff6a00,#ff8c38)', color: '#fff', border: 'none', borderRadius: 16, padding: '13px 20px', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 8px 28px rgba(255,106,0,0.35)', fontFamily: 'Hind Siliguri, sans-serif', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🛒</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 10, opacity: 0.85 }}>{cartCount}টি পণ্য</div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>৳{cartTotal.toLocaleString('bn-BD')}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>কার্ট দেখুন →</div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
