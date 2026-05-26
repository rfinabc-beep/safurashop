'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const getCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
const saveCart = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdated'));
};

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const syncCart = useCallback(() => {
    setCartItems(getCart());
    setLoading(false);
  }, []);

  useEffect(() => {
    syncCart();
    window.addEventListener('cartUpdated', syncCart);
    return () => window.removeEventListener('cartUpdated', syncCart);
  }, [syncCart]);

  const handleIncrease = (id) => {
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === id);
    if (idx !== -1) { cart[idx].quantity += 1; saveCart(cart); }
  };

  const handleDecrease = (id, minOrder) => {
    const minQty = minOrder ? parseInt(minOrder) : 1;
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === id);
    if (idx === -1) return;
    if (cart[idx].quantity <= minQty) {
      cart.splice(idx, 1);
    } else {
      cart[idx].quantity -= 1;
    }
    saveCart(cart);
  };

  const handleRemove = (id) => {
    const cart = getCart().filter(i => i.id !== id);
    saveCart(cart);
  };

  const handleClearCart = () => {
    if (confirm('কার্ট খালি করবেন?')) {
      saveCart([]);
    }
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { font-family: 'Hind Siliguri', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .cart-item { background: #fff; border-radius: 14px; border: 1.5px solid #ebebeb; overflow: hidden; animation: fadeUp 0.3s ease forwards; transition: border-color 0.2s, box-shadow 0.2s; }
        .cart-item:hover { border-color: #ffcfaa; box-shadow: 0 4px 16px rgba(255,106,0,0.08); }
        .qty-btn { border: none; cursor: pointer; font-weight: 800; font-size: 20px; display: flex; align-items: center; justify-content: center; background: none; color: #fff; transition: transform 0.15s; font-family: 'Hind Siliguri', sans-serif; width: 40px; height: 38px; }
        .qty-btn:active { transform: scale(0.82); }
        .remove-btn { border: none; background: none; cursor: pointer; color: #ccc; font-size: 18px; padding: 4px; transition: color 0.15s; }
        .remove-btn:hover { color: #ef4444; }
        .checkout-btn { border: none; cursor: pointer; font-family: 'Hind Siliguri', sans-serif; transition: all 0.2s; }
        .checkout-btn:hover { filter: brightness(0.93); }
        .checkout-btn:active { transform: scale(0.98); }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: cartItems.length > 0 ? 110 : 24 }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #ebebeb', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.back()} style={{ background: '#f5f5f5', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', color: '#555' }}>←</button>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>আমার কার্ট</h1>
              {cartItems.length > 0 && <p style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{cartItems.length}টি পণ্য</p>}
            </div>
          </div>
          {cartItems.length > 0 && (
            <button onClick={handleClearCart} style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontFamily: 'Hind Siliguri, sans-serif' }}>
              সব মুছুন
            </button>
          )}
        </div>

        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 14px 0' }}>

          {loading ? (
            /* Skeleton */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, height: 100, border: '1.5px solid #f0f0f0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                </div>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            /* Empty state */
            <div style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeUp 0.4s ease' }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#333', marginBottom: 8 }}>কার্ট খালি আছে</p>
              <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>পছন্দের পণ্য কার্টে যোগ করুন</p>
              <button onClick={() => router.push('/products')} style={{ background: 'linear-gradient(135deg,#ff6a00,#ff8c38)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif', boxShadow: '0 4px 14px rgba(255,106,0,0.28)' }}>
                পণ্য দেখুন →
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {cartItems.map((item, i) => {
                  const qty = item.quantity || 1;
                  const minQty = item.min_order ? parseInt(item.min_order) : 1;
                  const itemTotal = item.price * qty;

                  return (
                    <div key={item.id} className="cart-item" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div style={{ display: 'flex', gap: 0 }}>
                        {/* Product Image */}
                        <div style={{ width: 90, flexShrink: 0, background: '#f8f8f8', position: 'relative', overflow: 'hidden' }}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#fafafa,#f0f0f0)' }}>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d0d0d0" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {item.name}
                            </p>
                            <button className="remove-btn" onClick={() => handleRemove(item.id)}>✕</button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                            {/* Price */}
                            <div>
                              <span style={{ fontSize: 15, fontWeight: 800, color: '#ff6a00' }}>৳{itemTotal.toLocaleString('bn-BD')}</span>
                              <span style={{ fontSize: 10, color: '#bbb', marginLeft: 5 }}>৳{item.price} × {qty}</span>
                            </div>

                            {/* Qty control */}
                            <div style={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg,#ff6a00,#ff8c38)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(255,106,0,0.22)' }}>
                              <button className="qty-btn" onClick={() => handleDecrease(item.id, item.min_order)}>−</button>
                              <span style={{ color: '#fff', fontWeight: 800, fontSize: 14, minWidth: 28, textAlign: 'center' }}>{qty}</span>
                              <button className="qty-btn" onClick={() => handleIncrease(item.id)}>+</button>
                            </div>
                          </div>

                          {/* Min order notice */}
                          {minQty > 1 && (
                            <p style={{ fontSize: 10, color: '#f59e0b', marginTop: 4, fontWeight: 600 }}>সর্বনিম্ন অর্ডার: {minQty}টি</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #ebebeb', padding: '14px 16px', marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#bbb', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>অর্ডার সারসংক্ষেপ</p>

                {cartItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f8f8f8' }}>
                    <span style={{ fontSize: 12, color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{item.name} × {item.quantity || 1}</span>
                    <span style={{ fontSize: 12, color: '#555', fontWeight: 600, flexShrink: 0 }}>৳{(item.price * (item.quantity || 1)).toLocaleString('bn-BD')}</span>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1.5px solid #f0f0f0' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>সাবটোটাল</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#ff6a00' }}>৳{subtotal.toLocaleString('bn-BD')}</span>
                </div>
                <p style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>* ডেলিভারি চার্জ চেকআউটে যোগ হবে</p>
              </div>

              {/* Continue shopping */}
              <button onClick={() => router.push('/products')} style={{ width: '100%', background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif', marginBottom: 10, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6a00'; e.currentTarget.style.color = '#ff6a00'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#ebebeb'; e.currentTarget.style.color = '#666'; }}>
                ← আরও কেনাকাটা করুন
              </button>
            </>
          )}
        </div>

        {/* Fixed Checkout Bar */}
        {cartItems.length > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, padding: '10px 16px 20px', background: 'linear-gradient(to top, #fff 70%, transparent)' }}>
            <button className="checkout-btn" onClick={() => router.push('/checkout')}
              style={{ width: '100%', maxWidth: 560, margin: '0 auto', display: 'flex', background: 'linear-gradient(135deg,#ff6a00,#ff8c38)', color: '#fff', border: 'none', borderRadius: 16, padding: '14px 20px', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 28px rgba(255,106,0,0.35)', animation: 'slideUp 0.3s ease' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{cartItems.reduce((s, i) => s + (i.quantity || 1), 0)}টি পণ্য</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>৳{subtotal.toLocaleString('bn-BD')}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>চেকআউট করুন →</div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
