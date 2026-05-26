'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supaHeaders = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

const CAT_META = {
  'পোশাক':       { icon: '👕' },
  'মুদি':        { icon: '🛒' },
  'খাদ্য':       { icon: '🍚' },
  'ইলেকট্রনিক':  { icon: '📱' },
  'গৃহস্থালি':   { icon: '🏠' },
  'কৃষি':        { icon: '🌾' },
  'সৌন্দর্য':    { icon: '🧴' },
  'শিশু':        { icon: '👶' },
  'প্যাকেজিং':   { icon: '📦' },
  'হার্ডওয়্যার': { icon: '🔧' },
  'অর্গানিক':    { icon: '🌿' },
  'পানীয়':      { icon: '🥤' },
  'default':     { icon: '🏷️' },
};

function getCatIcon(name) {
  const key = Object.keys(CAT_META).find(k => name?.includes(k));
  return key ? CAT_META[key].icon : CAT_META['default'].icon;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subMap, setSubMap] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCatId, setHoveredCatId] = useState(null);
  const [expandedCatId, setExpandedCatId] = useState(null);
  const menuRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&order=name.asc`, { headers: supaHeaders })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const parents = data.filter(c => !c.parent_id);
        const children = data.filter(c => c.parent_id);
        const map = {};
        children.forEach(c => {
          if (!map[c.parent_id]) map[c.parent_id] = [];
          map[c.parent_id].push(c);
        });
        setCategories(parents);
        setSubMap(map);
        if (parents.length > 0) setHoveredCatId(parents[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMenuEnter = () => {
    clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };

  const handleMenuLeave = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 180);
  };

  const hoveredCategory = categories.find(c => c.id === hoveredCatId);
  const hoveredSubs = subMap[hoveredCatId] || [];

  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 6px 1px rgba(255,106,0,0.5); }
          50%       { box-shadow: 0 0 14px 4px rgba(255,106,0,0.9); }
        }
        .nav-icon-btn {
          background: none !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .nav-icon-btn:focus, .nav-icon-btn:active, .nav-icon-btn:hover {
          background: none !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        /* Sign in button */
        .signin-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(90deg, #ff6a00, #ff9a3c, #ff6a00);
          background-size: 200% auto;
          animation: shimmer 2.4s linear infinite, glow-pulse 2s ease-in-out infinite;
          letter-spacing: 0.02em;
          transition: transform 0.15s;
        }
        .signin-btn:hover {
          transform: scale(1.05);
        }
        .signin-btn-mobile {
          padding: 5px 10px;
          font-size: 11px;
          gap: 5px;
        }

        /* Category bar */
        .cat-bar-btn {
          background: none;
          border: none;
          color: #fff;
          padding: 9px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          border-bottom: 3px solid transparent;
          transition: border-color 0.15s, background 0.15s;
          letter-spacing: 0.01em;
        }
        .cat-bar-btn:hover {
          border-bottom-color: #fff;
          background: rgba(255,255,255,0.1);
        }
        .all-cat-btn {
          background: rgba(0,0,0,0.18) !important;
          border-radius: 0 !important;
          border-bottom: 3px solid transparent !important;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          padding: 9px 18px !important;
        }
        .all-cat-btn:hover, .all-cat-btn.open {
          background: rgba(0,0,0,0.32) !important;
          border-bottom-color: #fff !important;
        }

        /* Mega dropdown */
        .mega-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 999;
          background: #fff;
          box-shadow: 0 8px 32px rgba(0,0,0,0.16);
          border-radius: 0 0 10px 10px;
          border-top: 3px solid #ff6a00;
          display: flex;
          min-width: 560px;
          max-height: 420px;
          animation: dropdownFade 0.18s ease forwards;
          overflow: hidden;
        }
        .mega-left {
          width: 210px;
          flex-shrink: 0;
          background: #f9f9f9;
          border-right: 1px solid #f0f0f0;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .mega-left::-webkit-scrollbar { display: none; }
        .mega-left-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          cursor: pointer;
          border-left: 3px solid transparent;
          border-bottom: 1px solid #f5f5f5;
          transition: background 0.12s, border-color 0.12s;
          font-size: 13px;
          font-weight: 500;
          color: #333;
        }
        .mega-left-item:hover, .mega-left-item.active {
          background: #fff;
          border-left-color: #ff6a00;
          color: #ff6a00;
          font-weight: 700;
        }
        .mega-right {
          flex: 1;
          padding: 14px 16px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .mega-right::-webkit-scrollbar { display: none; }
        .mega-right-title {
          font-size: 11px;
          font-weight: 800;
          color: #ff6a00;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f0f0f0;
        }
        .mega-sub-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        .mega-sub-item {
          padding: 8px 6px;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: #444;
          transition: background 0.12s, color 0.12s;
          line-height: 1.4;
        }
        .mega-sub-item:hover {
          background: #fff3eb;
          color: #ff6a00;
        }
        .mega-sub-item .sub-icon {
          font-size: 20px;
          display: block;
          margin-bottom: 4px;
        }
        .mega-view-all {
          display: block;
          width: 100%;
          margin-top: 12px;
          padding: 8px;
          background: #ff6a00;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          text-align: center;
          transition: background 0.15s;
        }
        .mega-view-all:hover { background: #e85d00; }

        /* Accordion subcategory slide */
        @keyframes subSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sub-slide {
          animation: subSlide 0.18s ease forwards;
        }
      `}</style>

      {/* Top bar — desktop only */}
      {!isMobile && (
        <div style={{ background: '#222', color: '#ccc', fontSize: '11px', padding: '4px 20px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Bangladesh B2B Wholesale Platform</span>
          <span style={{ display: 'flex', gap: '12px' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => router.push('/about')}>Help</span>
            <span style={{ cursor: 'pointer' }} onClick={() => router.push('/contact')}>Contact</span>
          </span>
        </div>
      )}

      {/* Main nav */}
      <nav style={{
        background: '#1a1a2e',
        padding: isMobile ? '10px 16px' : '10px 20px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #ff6a00',
        position: 'sticky', top: 0, zIndex: 100
      }}>

        {/* Left: Hamburger (mobile) + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 0 }}>
          {isMobile && (
            <button
              className="nav-icon-btn"
              onClick={() => setMenuOpen(prev => !prev)}
              style={{ padding: '4px' }}
            >
              <HamburgerIcon color="#fff" />
            </button>
          )}
          <LogoMark router={router} size={isMobile ? 'small' : 'large'} />
        </div>

        {/* Right: Sign in + Cart */}
        <div style={{ display: 'flex', gap: isMobile ? 16 : 20, alignItems: 'center' }}>
          <button
            className={`signin-btn${isMobile ? ' signin-btn-mobile' : ''}`}
            onClick={() => router.push(user ? '/dashboard' : '/login')}
          >
            <UserIcon />
            {user ? 'Dashboard' : 'Sign In'}
          </button>
          <button className="nav-icon-btn" onClick={() => router.push('/checkout')}>
            <CartIcon />
            <CartCount />
          </button>
        </div>
      </nav>

      {/* Category bar — desktop only */}
      {!isMobile && (
        <div style={{
          background: '#ff6a00',
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          position: 'sticky',
          top: 54,
          zIndex: 99,
          boxShadow: '0 2px 8px rgba(255,106,0,0.18)',
        }}>
          <div
            ref={menuRef}
            style={{ position: 'relative', flexShrink: 0 }}
            onMouseEnter={handleMenuEnter}
            onMouseLeave={handleMenuLeave}
          >
            <button className={`cat-bar-btn all-cat-btn${menuOpen ? ' open' : ''}`}>
              <HamburgerIcon />
              All Categories
            </button>

            {menuOpen && categories.length > 0 && (
              <div className="mega-dropdown" onMouseEnter={handleMenuEnter} onMouseLeave={handleMenuLeave}>
                <div className="mega-left">
                  {categories.map(cat => (
                    <div
                      key={cat.id}
                      className={`mega-left-item${hoveredCatId === cat.id ? ' active' : ''}`}
                      onMouseEnter={() => setHoveredCatId(cat.id)}
                      onClick={() => {
                        router.push(`/products?cat=${encodeURIComponent(cat.name)}`);
                        setMenuOpen(false);
                      }}
                    >
                      <span style={{ fontSize: 16 }}>
                        {cat.image_url
                          ? <img src={cat.image_url} alt={cat.name} style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 4 }} />
                          : getCatIcon(cat.name)
                        }
                      </span>
                      <span>{cat.name}</span>
                      {subMap[cat.id]?.length > 0 && (
                        <span style={{ marginLeft: 'auto', color: '#bbb', fontSize: 11 }}>›</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mega-right">
                  {hoveredCategory && (
                    <div className="mega-right-title">{hoveredCategory.name}</div>
                  )}
                  {hoveredSubs.length > 0 ? (
                    <>
                      <div className="mega-sub-grid">
                        {hoveredSubs.map(sub => (
                          <div
                            key={sub.id}
                            className="mega-sub-item"
                            onClick={() => {
                              router.push(`/products?cat=${encodeURIComponent(sub.name)}`);
                              setMenuOpen(false);
                            }}
                          >
                            <span className="sub-icon">
                              {sub.image_url
                                ? <img src={sub.image_url} alt={sub.name} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6 }} />
                                : getCatIcon(sub.name)
                              }
                            </span>
                            {sub.name}
                          </div>
                        ))}
                      </div>
                      <button
                        className="mega-view-all"
                        onClick={() => {
                          router.push(`/products?cat=${encodeURIComponent(hoveredCategory?.name)}`);
                          setMenuOpen(false);
                        }}
                      >
                        View all in {hoveredCategory?.name} →
                      </button>
                    </>
                  ) : (
                    <button
                      className="mega-view-all"
                      onClick={() => {
                        router.push(`/products?cat=${encodeURIComponent(hoveredCategory?.name)}`);
                        setMenuOpen(false);
                      }}
                    >
                      View all products →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {categories.slice(0, 8).map(cat => (
            <button
              key={cat.id}
              className="cat-bar-btn"
              onClick={() => router.push(`/products?cat=${encodeURIComponent(cat.name)}`)}
            >
              {cat.name}
            </button>
          ))}

          <button
            className="cat-bar-btn"
            style={{ marginLeft: 'auto', opacity: 0.85 }}
            onClick={() => router.push('/products')}
          >
            View All →
          </button>
        </div>
      )}

      {/* Mobile: slide-out category drawer with accordion */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: 'relative', width: 300, background: '#fff',
            height: '100%', overflowY: 'auto', zIndex: 1,
            animation: 'slideInLeft 0.22s ease forwards',
          }}>
            {/* Drawer header */}
            <div style={{
              background: '#1a1a2e', padding: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, zIndex: 2,
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>All Categories</span>
              <button className="nav-icon-btn" onClick={() => setMenuOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Accordion categories */}
            {categories.map(cat => {
              const subs = subMap[cat.id] || [];
              const isOpen = expandedCatId === cat.id;
              return (
                <div key={cat.id}>
                  {/* Parent row */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 16px', borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer', fontSize: 14, fontWeight: 700,
                      color: isOpen ? '#ff6a00' : '#222',
                      background: isOpen ? '#fff8f3' : '#fff',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onClick={() => {
                      if (subs.length > 0) {
                        setExpandedCatId(isOpen ? null : cat.id);
                      } else {
                        router.push(`/products?cat=${encodeURIComponent(cat.name)}`);
                        setMenuOpen(false);
                      }
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{getCatIcon(cat.name)}</span>
                    <span style={{ flex: 1 }}>{cat.name}</span>
                    {subs.length > 0 && (
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: isOpen ? '#ff6a00' : '#f0f0f0',
                        color: isOpen ? '#fff' : '#555',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 700, flexShrink: 0,
                        transition: 'background 0.15s, color 0.15s',
                      }}>
                        {isOpen ? '−' : '+'}
                      </span>
                    )}
                  </div>

                  {/* Subcategories (accordion) */}
                  {isOpen && subs.length > 0 && (
                    <div className="sub-slide">
                      {subs.map(sub => (
                        <div
                          key={sub.id}
                          style={{
                            padding: '10px 16px 10px 52px',
                            borderBottom: '1px solid #f8f8f8',
                            fontSize: 13, color: '#555', cursor: 'pointer',
                            background: '#fafafa',
                            transition: 'background 0.12s',
                          }}
                          onClick={() => {
                            router.push(`/products?cat=${encodeURIComponent(sub.name)}`);
                            setMenuOpen(false);
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fff3eb'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fafafa'}
                        >
                          {sub.name}
                        </div>
                      ))}
                      {/* View all in category */}
                      <div
                        style={{
                          padding: '10px 16px 10px 52px',
                          borderBottom: '2px solid #f0f0f0',
                          fontSize: 12, color: '#ff6a00', cursor: 'pointer',
                          fontWeight: 700, background: '#fafafa',
                        }}
                        onClick={() => {
                          router.push(`/products?cat=${encodeURIComponent(cat.name)}`);
                          setMenuOpen(false);
                        }}
                      >
                        সব দেখুন →
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Sub-components ── */

function LogoMark({ router, size }) {
  const w = size === 'large' ? 80 : 70;
  const h = size === 'large' ? 32 : 28;
  const dot = size === 'large' ? 7 : 6;
  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'flex-end', cursor: 'pointer', flexShrink: 0 }}
      onClick={() => router.push('/')}
    >
      <Image src="/logo.png" alt="Arat" width={w} height={h} style={{ objectFit: 'contain' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '3px', marginBottom: '3px' }}>
        {['#ff3b3b', '#e8a020', '#22c55e'].map((bg, i) => (
          <span key={i} style={{ width: dot, height: dot, borderRadius: '50%', background: bg, display: 'block', animation: `blink 1.2s ease-in-out infinite ${i * 0.4}s` }} />
        ))}
      </div>
    </div>
  );
}

function HamburgerIcon({ color = '#fff' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function CartCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCount(cart.length);
    };
    update();
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, []);
  if (count === 0) return null;
  return (
    <span style={{
      position: 'absolute', top: '-6px', right: '-6px',
      background: '#ff6a00', color: '#fff', borderRadius: '50%',
      width: '18px', height: '18px', fontSize: '11px', fontWeight: '700',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {count}
    </span>
  );
}
