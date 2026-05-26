'use client';
import { Suspense, useCallback } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
const saveCart = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdated'));
};

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', overflow: 'hidden' }}>
      <div style={{ height: 170, background: 'linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      <div style={{ padding: 12 }}>
        <div style={{ height: 11, background: 'linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 11, width: '65%', background: 'linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 6, marginBottom: 14 }} />
        <div style={{ height: 36, background: 'linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 9 }} />
      </div>
    </div>
  );
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts]           = useState([]);
  const [brands, setBrands]               = useState([]);
  const [categories, setCategories]       = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCat, setSelectedCat]     = useState(searchParams.get('cat') || '');
  const [sortBy, setSortBy]               = useState('newest');
  const [loading, setLoading]             = useState(true);
  const [cartQty, setCartQty]             = useState({});
  const [cartTotal, setCartTotal]         = useState(0);
  const [cartCount, setCartCount]         = useState(0);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [isMobile, setIsMobile]           = useState(false);
  const drawerRef = useRef(null);

  const syncCart = useCallback(() => {
    const cart = getCart();
    const map = {};
    let total = 0, count = 0;
    cart.forEach(i => {
      map[i.id] = i.quantity;
      total += (i.price || 0) * i.quantity;
      count += i.quantity;
    });
    setCartQty(map);
    setCartTotal(total);
    setCartCount(count);
  }, []);

  useEffect(() => {
    syncCart();
    window.addEventListener('cartUpdated', syncCart);
    return () => window.removeEventListener('cartUpdated', syncCart);
  }, [syncCart]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const h = (e) => { if (drawerRef.current && !drawerRef.current.contains(e.target)) setDrawerOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [drawerOpen]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        setCategories([...new Set(data.map(p => p.category).filter(Boolean))].sort());
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchProducts(); fetchBrands(); }, [fetchProducts, fetchBrands]);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    const minQty = product.min_order ? parseInt(product.min_order) : 1;
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === product.id);
    if (idx === -1) {
      cart.push({ ...product, quantity: minQty });
    } else {
      cart[idx].quantity += 1;
    }
    saveCart(cart);
  };

  const handleIncrease = (e, product) => {
    e.stopPropagation();
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === product.id);
    if (idx !== -1) { cart[idx].quantity += 1; saveCart(cart); }
  };

  const handleDecrease = (e, product) => {
    e.stopPropagation();
    const minQty = product.min_order ? parseInt(product.min_order) : 1;
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === product.id);
    if (idx === -1) return;
    if (cart[idx].quantity <= minQty) {
      cart.splice(idx, 1);
    } else {
      cart[idx].quantity -= 1;
    }
    saveCart(cart);
  };

  let filtered = products;
  if (selectedBrand) filtered = filtered.filter(p => p.brand_id === selectedBrand);
  if (selectedCat)   filtered = filtered.filter(p => p.category === selectedCat);
  if (sortBy === 'price_asc')  filtered = [...filtered].sort((a,b) => a.price - b.price);
  if (sortBy === 'price_desc') filtered = [...filtered].sort((a,b) => b.price - a.price);

  const hasActiveFilter = selectedBrand || selectedCat;
  const activeBrandName = brands.find(b => b.id === selectedBrand)?.name;

  const BrandList = () => (
    <div style={{ padding: '16px 12px' }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: '#bbb', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, paddingLeft: 6 }}>ব্র্যান্ড বাছুন</p>
      {[{ id: '', name: 'সব ব্র্যান্ড', emoji: '🏪' }, ...brands].map(brand => {
        const isActive = selectedBrand === brand.id;
        return (
          <button key={brand.id || 'all'}
            onClick={() => { setSelectedBrand(brand.id === selectedBrand ? '' : brand.id); if (isMobile) setDrawerOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 10px', borderRadius: 10, marginBottom: 3, border: 'none', cursor: 'pointer', textAlign: 'left', background: isActive ? '#fff5f0' : 'transparent', borderLeft: `3px solid ${isActive ? '#ff6a00' : 'transparent'}`, transition: 'all 0.15s' }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#fafafa'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            {brand.emoji
              ? <span style={{ fontSize: 18 }}>{brand.emoji}</span>
              : brand.logo_url
                ? <img src={brand.logo_url} alt={brand.name} style={{ height: 22, width: 44, objectFit: 'contain', borderRadius: 4 }} />
                : <div style={{ width: 36, height: 22, background: '#f0f0f0', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#bbb' }}>{brand.name?.charAt(0)}</div>
            }
            <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#ff6a00' : '#444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand.name}</span>
            {isActive && <span style={{ fontSize: 10, color: '#ff6a00' }}>✓</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { font-family: 'Hind Siliguri', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes shimmer   { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeUp    { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn     { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slideLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes fadeScrim { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp   { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .prod-card { animation: fadeUp 0.3s ease forwards; background: #fff; cursor: pointer; transition: transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s, border-color 0.22s; }
        .prod-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(255,106,0,0.12) !important; border-color: #ffcfaa !important; }
        .prod-card:active { transform: scale(0.98); }
        .prod-img { transition: transform 0.35s ease; display: block; width: 100%; height: 100%; object-fit: cover; }
        .prod-card:hover .prod-img { transform: scale(1.06); }
        .qty-badge { animation: popIn 0.3s cubic-bezier(.4,0,.2,1) forwards; }
        .qty-btn { border: none; cursor: pointer; font-family: 'Hind Siliguri', sans-serif; font-weight: 800; font-size: 20px; line-height: 1; display: flex; align-items: center; justify-content: center; transition: all 0.15s; background: none; }
        .qty-btn:active { transform: scale(0.85); }
        .cart-btn { border: none; cursor: pointer; font-family: 'Hind Siliguri', sans-serif; transition: all 0.18s; }
        .cart-btn:hover { filter: brightness(0.92); }
        .cart-btn:active { transform: scale(0.97); }
        .cat-chip { cursor: pointer; white-space: nowrap; font-family: 'Hind Siliguri', sans-serif; transition: all 0.15s; }
        .cat-chip:hover { border-color: #ff6a00 !important; color: #ff6a00 !important; }
        .sort-select { cursor: pointer; font-family: 'Hind Siliguri', sans-serif; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px !important; }
        .sort-select:focus { outline: none; border-color: #ff6a00 !important; }
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.38); z-index: 200; animation: fadeScrim 0.2s ease; }
        .drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; background: #fff; z-index: 201; overflow-y: auto; animation: slideLeft 0.25s ease; box-shadow: 4px 0 24px rgba(0,0,0,0.13); }
        .float-cart { animation: slideUp 0.35s cubic-bezier(.4,0,.2,1) forwards; }
        .float-cart:hover { filter: brightness(0.93); transform: translateY(-2px); }
        .float-cart:active { transform: scale(0.97); }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }

        @media (max-width: 480px) {
          .product-grid { grid-template-columns: repeat(2,1fr) !important; gap: 8px !important; }
          .prod-img-wrap { height: 140px !important; }
          .prod-name { font-size: 12px !important; min-height: 32px !important; }
          .prod-price { font-size: 15px !important; }
          .cart-btn { font-size: 11px !important; padding: 7px !important; }
        }
        @media (min-width: 481px) and (max-width: 768px)  { .product-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (min-width: 769px) and (max-width: 1024px) { .product-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (min-width: 1025px) { .product-grid { grid-template-columns: repeat(auto-fill,minmax(190px,1fr)) !important; } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: cartCount > 0 ? 80 : 0 }}>

        {/* Top Bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #ebebeb', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {isMobile && brands.length > 0 && (
              <button onClick={() => setDrawerOpen(true)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${selectedBrand ? '#ff6a00' : '#e8e8e8'}`, background: selectedBrand ? '#fff5f0' : '#fafafa', color: selectedBrand ? '#ff6a00' : '#666', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <span>🏪</span><span>{activeBrandName || 'ব্র্যান্ড'}</span>
                {selectedBrand && <span style={{ fontSize: 10 }}>✓</span>}
              </button>
            )}
            <button className="cat-chip" onClick={() => setSelectedCat('')} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: selectedCat === '' ? '2px solid #ff6a00' : '1.5px solid #e8e8e8', background: selectedCat === '' ? '#fff5f0' : '#fafafa', color: selectedCat === '' ? '#ff6a00' : '#666', flexShrink: 0 }}>
              সব ক্যাটাগরি
            </button>
            {categories.map(cat => (
              <button key={cat} className="cat-chip" onClick={() => setSelectedCat(cat === selectedCat ? '' : cat)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: selectedCat === cat ? '2px solid #ff6a00' : '1.5px solid #e8e8e8', background: selectedCat === cat ? '#fff5f0' : '#fafafa', color: selectedCat === cat ? '#ff6a00' : '#666', flexShrink: 0 }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid #f5f5f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#888' }}><b style={{ color: '#1a1a1a', fontWeight: 800 }}>{filtered.length}</b>টি পণ্য</span>
              {selectedCat && <span style={{ fontSize: 11, background: '#fff5f0', color: '#ff6a00', fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid #ffcfaa' }}>{selectedCat}</span>}
              {activeBrandName && <span style={{ fontSize: 11, background: '#fff5f0', color: '#ff6a00', fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid #ffcfaa' }}>{activeBrandName}</span>}
              {hasActiveFilter && (
                <button onClick={() => { setSelectedBrand(''); setSelectedCat(''); }} style={{ fontSize: 11, color: '#999', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Hind Siliguri, sans-serif' }}>ফিল্টার সরান</button>
              )}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-select" style={{ border: '1.5px solid #e8e8e8', borderRadius: 9, padding: '6px 28px 6px 10px', fontSize: 12, color: '#555', outline: 'none', background: '#fafafa', minWidth: 110 }}>
              <option value="newest">নতুন আগে</option>
              <option value="price_asc">দাম: কম → বেশি</option>
              <option value="price_desc">দাম: বেশি → কম</option>
            </select>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isMobile && drawerOpen && (
          <>
            <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
            <div className="drawer" ref={drawerRef}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#1a1a1a' }}>ব্র্যান্ড বাছুন</span>
                <button onClick={() => setDrawerOpen(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#666' }}>✕</button>
              </div>
              <BrandList />
            </div>
          </>
        )}

        {/* Layout */}
        <div style={{ display: 'flex', maxWidth: 1440, margin: '0 auto' }}>
          {!isMobile && brands.length > 0 && (
            <aside style={{ width: 210, flexShrink: 0, background: '#fff', borderRight: '1px solid #ebebeb', position: 'sticky', top: 93, alignSelf: 'flex-start', overflowY: 'auto', maxHeight: 'calc(100vh - 93px)' }}>
              <BrandList />
            </aside>
          )}

          <main style={{ flex: 1, padding: isMobile ? 10 : 16 }}>
            {loading ? (
              <div className="product-grid" style={{ display: 'grid', gap: 12 }}>
                {[...Array(isMobile ? 4 : 8)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeUp 0.4s ease' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#555', marginBottom: 6 }}>কোনো পণ্য পাওয়া যায়নি</p>
                <p style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
                {hasActiveFilter && (
                  <button onClick={() => { setSelectedBrand(''); setSelectedCat(''); }} style={{ background: '#ff6a00', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif' }}>সব পণ্য দেখুন</button>
                )}
              </div>
            ) : (
              <div className="product-grid" style={{ display: 'grid', gap: 12 }}>
                {filtered.map((p, i) => {
                  const discount  = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : null;
                  const qty       = cartQty[p.id] || 0;
                  const inCart    = qty > 0;
                  const outOfStock = p.stock !== undefined && p.stock !== null && p.stock <= 0;
                  const minQty    = p.min_order ? parseInt(p.min_order) : 1;

                  return (
                    <div key={p.id} className="prod-card"
                      onClick={() => !outOfStock && router.push(`/products/${p.id}`)}
                      style={{ borderRadius: 14, border: `1.5px solid ${inCart ? '#ffcfaa' : '#ebebeb'}`, overflow: 'hidden', animationDelay: `${Math.min(i * 0.05, 0.4)}s`, boxShadow: inCart ? '0 4px 16px rgba(255,106,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)', opacity: outOfStock ? 0.72 : 1 }}
                    >
                      {/* Image */}
                      <div className="prod-img-wrap" style={{ height: 170, position: 'relative', overflow: 'hidden', background: '#f8f8f8' }}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className="prod-img" loading="lazy" />
                          : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg,#fafafa,#f0f0f0)' }}>
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d0d0d0" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                              <span style={{ fontSize: 10, color: '#ccc', fontWeight: 600 }}>ছবি নেই</span>
                            </div>
                          )
                        }

                        {/* Out of stock overlay */}
                        {outOfStock && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 20 }}>স্টক শেষ</span>
                          </div>
                        )}

                        {/* Quantity badge — top LEFT */}
                        {inCart && (
                          <div className="qty-badge" style={{ position: 'absolute', top: 8, left: 8, background: '#ff6a00', color: '#fff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, boxShadow: '0 2px 8px rgba(255,106,0,0.4)', border: '2px solid #fff' }}>
                            {qty}
                          </div>
                        )}

                        {/* Discount badge — top RIGHT */}
                        {discount && !outOfStock && (
                          <span style={{ position: 'absolute', top: 8, right: 8, background: 'linear-gradient(135deg,#ef4444,#f87171)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20, boxShadow: '0 2px 6px rgba(239,68,68,0.3)' }}>-{discount}%</span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding: '10px 12px 12px' }}>
                        <p className="prod-name" style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.45, marginBottom: 7, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 38 }}>
                          {p.name}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: minQty > 1 ? 4 : 10 }}>
                          <span className="prod-price" style={{ fontSize: 17, fontWeight: 800, color: outOfStock ? '#aaa' : '#ff6a00' }}>
                            ৳{p.price?.toLocaleString('bn-BD')}
                          </span>
                          {/* MRP: শুধু দেখাবে যদি আসলেই বড় হয় */}
                          {p.mrp && p.mrp > p.price && (
                            <span style={{ fontSize: 11, color: '#c0c0c0', textDecoration: 'line-through', fontWeight: 500 }}>৳{p.mrp?.toLocaleString('bn-BD')}</span>
                          )}
                        </div>

                        {/* Min order — শুধু দেখাবে যদি ১ এর বেশি হয় */}
                        {minQty > 1 && (
                          <p style={{ fontSize: 10, color: '#f59e0b', marginBottom: 9, fontWeight: 600 }}>সর্বনিম্ন অর্ডার: {minQty}টি</p>
                        )}

                        {/* Cart button */}
                        {outOfStock ? (
                          <div style={{ width: '100%', background: '#f3f4f6', color: '#aaa', borderRadius: 10, padding: '9px 8px', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>স্টক শেষ</div>
                        ) : inCart ? (
                          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#ff6a00,#ff8c38)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 3px 10px rgba(255,106,0,0.25)' }}>
                            <button className="qty-btn" onClick={e => handleDecrease(e, p)} style={{ width: 40, height: 36, color: '#fff', fontSize: 22 }}>−</button>
                            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{qty}</span>
                            <button className="qty-btn" onClick={e => handleIncrease(e, p)} style={{ width: 40, height: 36, color: '#fff', fontSize: 22 }}>+</button>
                          </div>
                        ) : (
                          <button className="cart-btn" onClick={e => handleAddToCart(e, p)}
                            style={{ width: '100%', background: 'linear-gradient(135deg,#ff6a00,#ff8c38)', color: '#fff', borderRadius: 10, padding: '9px 8px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 3px 10px rgba(255,106,0,0.2)' }}>
                            <span>🛒</span><span>কার্টে যোগ করুন</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* ── Floating Cart Button ── */}
        {cartCount > 0 && (
          <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 150, width: 'calc(100% - 32px)', maxWidth: 420 }}>
            <button className="float-cart" onClick={() => router.push('/cart')}
              style={{ width: '100%', background: 'linear-gradient(135deg,#ff6a00,#ff8c38)', color: '#fff', border: 'none', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 8px 28px rgba(255,106,0,0.38)', fontFamily: 'Hind Siliguri, sans-serif', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛒</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{cartCount}টি পণ্য</div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>৳{cartTotal.toLocaleString('bn-BD')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>
                <span>কার্ট দেখুন</span>
                <span style={{ fontSize: 16 }}>→</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Hind Siliguri, sans-serif', color: '#aaa', fontSize: 15 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>লোড হচ্ছে...</p>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
