'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
};

const CAT_META = {
  'পোশাক':       { icon: '👕', color: '#f97316' },
  'মুদি':        { icon: '🛒', color: '#16a34a' },
  'খাদ্য':       { icon: '🍚', color: '#16a34a' },
  'ইলেকট্রনিক':  { icon: '📱', color: '#2563eb' },
  'গৃহস্থালি':   { icon: '🏠', color: '#db2777' },
  'কৃষি':        { icon: '🌾', color: '#65a30d' },
  'সৌন্দর্য':    { icon: '🧴', color: '#9333ea' },
  'শিশ':        { icon: '👶', color: '#d97706' },
  'প্যাকেজিং':   { icon: '📦', color: '#0891b2' },
  'হার্ডওয়্যার': { icon: '🔧', color: '#dc2626' },
  'অর্গানিক':    { icon: '🌿', color: '#65a30d' },
  'পানীয়':      { icon: '🥤', color: '#0284c7' },
  'default':     { icon: '🏷️', color: '#f97316' },
};

function getMeta(name) {
  const key = Object.keys(CAT_META).find(k => name?.includes(k));
  return key ? CAT_META[key] : CAT_META['default'];
}

export default function CategorySection() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [subMap, setSubMap] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const rightPanelRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/categories?select=*&order=name.asc`,
          { headers }
        );
        const data = await res.json();
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
        if (parents.length > 0) setActiveId(parents[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = 0;
    }
  }, [activeId]);

  const activeCategory = categories.find(c => c.id === activeId);
  const activeSubs = subMap[activeId] || [];

  const handleSubClick = (sub) => {
    router.push(`/products?cat=${encodeURIComponent(sub.name)}`);
  };

  const handleViewAll = () => {
    if (activeCategory) {
      router.push(`/products?cat=${encodeURIComponent(activeCategory.name)}`);
    }
  };

  const subGridCols = isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)';
  const leftPanelWidth = isMobile ? 88 : 100;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        .cat-left-item {
          cursor: pointer;
          transition: all 0.18s ease;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          position: relative;
        }
        .cat-left-item:active { opacity: 0.7; }
        .sub-grid-item {
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          animation: slideRight 0.25s ease forwards;
        }
        .sub-grid-item:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(249,115,22,0.15); }
        .sub-grid-item:active { transform: scale(0.95); }
        .right-panel::-webkit-scrollbar { display: none; }
        .right-panel { -ms-overflow-style: none; scrollbar-width: none; }
        .left-panel::-webkit-scrollbar { display: none; }
        .left-panel { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div style={{ background: '#fff', borderRadius: 0, overflow: 'hidden' }}>

        {/* Two-column layout */}
        <div style={{ display: 'flex', minHeight: 380, maxHeight: isMobile ? 380 : 440 }}>

          {/* Left: Category List */}
          <div
            className="left-panel"
            style={{ width: leftPanelWidth, flexShrink: 0, borderRight: '1px solid #f0f0f0', overflowY: 'auto', background: '#fafafa' }}
          >
            {loading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} style={{ padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0f0f0' }} />
                    <div style={{ width: 50, height: 8, borderRadius: 4, background: '#f0f0f0' }} />
                  </div>
                ))
              : categories.map((cat) => {
                  const meta = getMeta(cat.name);
                  const isActive = activeId === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className="cat-left-item"
                      onClick={() => setActiveId(cat.id)}
                      style={{
                        padding: '12px 6px',
                        textAlign: 'center',
                        background: isActive ? '#fff' : 'transparent',
                        borderLeft: isActive ? '3px solid #f97316' : '3px solid transparent',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <div style={{
                        width: isMobile ? 40 : 44, height: isMobile ? 40 : 44, borderRadius: 12,
                        background: isActive ? `${meta.color}18` : '#f0f0f0',
                        margin: '0 auto 6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', transition: 'background 0.2s',
                        fontSize: isMobile ? 18 : 20,
                      }}>
                        {cat.image_url
                          ? <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : meta.icon
                        }
                      </div>
                      <p style={{
                        fontSize: 10, fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#f97316' : '#666',
                        lineHeight: 1.3, margin: 0,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        transition: 'color 0.2s',
                      }}>
                        {cat.name}
                      </p>
                    </div>
                  );
                })
            }
          </div>

          {/* Right: Sub-category Grid */}
          <div
            className="right-panel"
            ref={rightPanelRef}
            style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', background: '#fff' }}
          >
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: subGridCols, gap: 8 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ borderRadius: 12, background: '#f5f5f5', height: 100 }} />
                ))}
              </div>
            ) : (
              <>
                {activeCategory && (
                  <div
                    onClick={handleViewAll}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#fff3eb', borderRadius: 10, marginBottom: 10, cursor: 'pointer', border: '1px solid #ffe0cc' }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>View all {activeCategory.name}</span>
                    <span style={{ fontSize: 13, color: '#f97316' }}>→</span>
                  </div>
                )}

                {activeSubs.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: subGridCols, gap: isMobile ? 7 : 10 }}>
                    {activeSubs.map((sub, i) => {
                      const meta = getMeta(sub.name);
                      return (
                        <div
                          key={sub.id}
                          className="sub-grid-item"
                          onClick={() => handleSubClick(sub)}
                          style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
                        >
                          <div style={{
                            width: '100%', aspectRatio: '1', borderRadius: 10,
                            background: sub.image_url ? '#f8f8f8' : `${meta.color}12`,
                            overflow: 'hidden', marginBottom: 5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid #f0f0f0',
                            fontSize: isMobile ? 24 : 28,
                          }}>
                            {sub.image_url
                              ? <img src={sub.image_url} alt={sub.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : meta.icon
                            }
                          </div>
                          <p style={{
                            fontSize: 10, fontWeight: 600, color: '#333',
                            textAlign: 'center', lineHeight: 1.3, margin: 0,
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {sub.name}
                          </p>
                        </div>
                      );
                    })}

                    {/* View More tile */}
                    <div
                      className="sub-grid-item"
                      onClick={handleViewAll}
                      style={{ animationDelay: `${activeSubs.length * 0.04}s`, opacity: 0 }}
                    >
                      <div style={{
                        width: '100%', aspectRatio: '1', borderRadius: 10,
                        background: '#f5f5f5', border: '1px solid #ebebeb',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 4,
                        marginBottom: 5,
                      }}>
                        <span style={{ fontSize: 20, color: '#bbb' }}>•••</span>
                      </div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#aaa', textAlign: 'center', margin: 0 }}>View More</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70%', gap: 10 }}>
                    <div style={{ fontSize: 42 }}>{getMeta(activeCategory?.name).icon}</div>
                    <p style={{ fontSize: 13, color: '#888', textAlign: 'center', fontWeight: 600 }}>{activeCategory?.name}</p>
                    <button
                      onClick={handleViewAll}
                      style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      View All Products →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
