'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const CAT_GRADIENT = {
  'সৌন্দর্য':    'linear-gradient(135deg,#fff7ed,#ffedd5)',
  'খাদ্য':       'linear-gradient(135deg,#f0fdf4,#dcfce7)',
  'খাদ্যশস্য':   'linear-gradient(135deg,#f0fdf4,#dcfce7)',
  'পানীয়':      'linear-gradient(135deg,#eff6ff,#dbeafe)',
  'প্যাকেজিং':   'linear-gradient(135deg,#fdf4ff,#fae8ff)',
  'পোশাক':       'linear-gradient(135deg,#fff1f2,#ffe4e6)',
  'ইলেকট্রনিক':  'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
  'গৃহস্থালি':   'linear-gradient(135deg,#fdf2f8,#fce7f3)',
  'কৃষি':        'linear-gradient(135deg,#f7fee7,#ecfccb)',
  'মুদি':        'linear-gradient(135deg,#fffbeb,#fef3c7)',
  'default':     'linear-gradient(135deg,#f8fafc,#f1f5f9)',
};

const CAT_COLOR = {
  'সৌন্দর্য':    '#f97316',
  'খাদ্য':       '#16a34a',
  'খাদ্যশস্য':   '#16a34a',
  'পানীয়':      '#3b82f6',
  'প্যাকেজিং':   '#9333ea',
  'পোশাক':       '#f43f5e',
  'ইলেকট্রনিক':  '#0ea5e9',
  'গৃহস্থালি':   '#ec4899',
  'কৃষি':        '#65a30d',
  'মুদি':        '#d97706',
  'default':     '#f97316',
};

function getGradient(cat) {
  const key = Object.keys(CAT_GRADIENT).find(k => cat?.includes(k));
  return key ? CAT_GRADIENT[key] : CAT_GRADIENT['default'];
}

function getCatColor(cat) {
  const key = Object.keys(CAT_COLOR).find(k => cat?.includes(k));
  return key ? CAT_COLOR[key] : CAT_COLOR['default'];
}

export default function ProductsSection() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [addedIds, setAddedIds] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/products?select=*&active=eq.true&limit=8&order=created_at.desc`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
          setTimeout(() => setVisible(true), 100);
        }
      } catch (e) {}
    };
    fetchProducts();
  }, []);

  const addToCart = (e, product) => {
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const exists = cart.find(i => i.id === product.id);
    if (!exists) {
      cart.push({ ...product, quantity: product.moq || 1 });
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
    }
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedIds(prev => ({ ...prev, [product.id]: false })), 1800);
  };

  if (products.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { transform: scale(0.9); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .ps-card {
          transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s ease;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .ps-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
        }
        .ps-card:active { transform: scale(0.97); }
        .ps-add-btn {
          transition: transform 0.12s ease, background 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .ps-add-btn:active { transform: scale(0.88); }
      `}</style>

      <div style={{ padding: isMobile ? '4px 12px 20px' : '4px 20px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: '700', color: '#111', lineHeight: 1.2 }}>
              ফিচার্ড পণ্য
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
              সর্বশেষ যোগ হওয়া পণ্য
            </div>
          </div>
          <button
            onClick={() => router.push('/products')}
            style={{
              background: '#f97316', color: '#fff', border: 'none',
              fontSize: '11px', fontWeight: '500', padding: '6px 14px',
              borderRadius: '20px', cursor: 'pointer',
            }}
          >
            সব দেখুন →
          </button>
        </div>

        {/* Grid — 2 col mobile, 4 col desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(2, minmax(0,1fr))'
            : 'repeat(4, minmax(0,1fr))',
          gap: isMobile ? '10px' : '12px',
        }}>
          {products.map((p, i) => {
            const isAdded = addedIds[p.id];
            const hasDiscount = p.mrp && parseFloat(p.mrp) > parseFloat(p.price);
            const discountPct = hasDiscount
              ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
              : null;
            const gradient = getGradient(p.category);
            const catColor = getCatColor(p.category);

            return (
              <div
                key={p.id}
                className="ps-card"
                onClick={() => router.push('/products')}
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  border: '0.5px solid #e5e5e5',
                  overflow: 'hidden',
                  opacity: visible ? 1 : 0,
                  animation: visible ? `fadeUp 0.35s ease forwards` : 'none',
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                {/* Image area */}
                <div style={{
                  height: isMobile ? '130px' : '150px',
                  background: p.image_url ? '#f9f9f9' : gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ fontSize: '48px', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.08))' }}>
                      📦
                    </div>
                  )}

                  {discountPct && (
                    <div style={{
                      position: 'absolute', top: 8, left: 8,
                      background: '#ef4444', color: '#fff',
                      fontSize: '9px', fontWeight: '600',
                      padding: '3px 7px', borderRadius: '4px',
                    }}>
                      −{discountPct}%
                    </div>
                  )}

                  {!discountPct && i < 3 && (
                    <div style={{
                      position: 'absolute', top: 8, left: 8,
                      background: '#f97316', color: '#fff',
                      fontSize: '9px', fontWeight: '600',
                      padding: '3px 7px', borderRadius: '4px',
                    }}>
                      নতুন
                    </div>
                  )}

                  {(p.moq || p.min_order) && (
                    <div style={{
                      position: 'absolute', bottom: 8, right: 8,
                      background: 'rgba(255,255,255,0.92)',
                      borderRadius: '7px', padding: '3px 8px',
                      fontSize: '10px', fontWeight: '500', color: catColor,
                    }}>
                      MOQ: {p.moq || p.min_order}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '10px 10px 12px' }}>
                  {p.category && (
                    <div style={{
                      fontSize: '9px', fontWeight: '600',
                      color: '#aaa',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      marginBottom: '3px',
                    }}>
                      {p.category}
                    </div>
                  )}

                  <div style={{
                    fontSize: isMobile ? '12px' : '13px', fontWeight: '500',
                    color: '#111',
                    lineHeight: '1.35', marginBottom: '10px',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {p.name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '600', color: '#f97316', lineHeight: 1 }}>
                        ৳{parseFloat(p.price).toLocaleString('bn-BD')}
                      </div>
                      {hasDiscount ? (
                        <div style={{ fontSize: '10px', color: '#bbb', textDecoration: 'line-through', marginTop: '1px' }}>
                          ৳{parseFloat(p.mrp).toLocaleString('bn-BD')}
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: 'transparent' }}>—</div>
                      )}
                    </div>

                    <button
                      className="ps-add-btn"
                      onClick={(e) => addToCart(e, p)}
                      style={{
                        width: isMobile ? '30px' : '34px',
                        height: isMobile ? '30px' : '34px',
                        background: isAdded ? '#22c55e' : '#f97316',
                        color: '#fff', border: 'none',
                        borderRadius: '10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        animation: isAdded ? 'popIn 0.2s ease' : 'none',
                      }}
                      aria-label={isAdded ? 'যোগ হয়েছে' : 'কার্টে যোগ করুন'}
                    >
                      {isAdded
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
