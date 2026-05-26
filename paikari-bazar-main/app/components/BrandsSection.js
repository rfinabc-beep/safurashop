'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function BrandsSection({ selectedBrand, setSelectedBrand }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/brands')
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(d => {
        setBrands(Array.isArray(d) ? d.filter(b => b.logo_url) : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const filteredBrands = useMemo(() => brands, [brands]);

  const handleSelect = useCallback((id) => {
    setSelectedBrand(prev => (prev === id ? null : id));
  }, [setSelectedBrand]);

  return (
    <>
      <style>{`
        .brand-scroll::-webkit-scrollbar { height: 4px; }
        .brand-scroll::-webkit-scrollbar-track { background: #f5f5f5; }
        .brand-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        .brand-card {
          transition: all 0.2s ease;
          cursor: pointer;
          flex-shrink: 0;
          border: none;
          background: none;
          padding: 0;
          font-family: inherit;
        }
        .brand-card:hover .brand-card-inner {
          border-color: #ff6a00 !important;
          box-shadow: 0 4px 16px rgba(255,106,0,0.12) !important;
          transform: translateY(-2px);
        }
        .brand-card-inner {
          transition: all 0.2s ease;
        }
        .shop-by-brand-card {
          flex-shrink: 0;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
          transition: all 0.2s ease;
        }
        .shop-by-brand-card:hover .shop-inner {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255,106,0,0.25) !important;
        }
        .shop-inner { transition: all 0.2s ease; }
      `}</style>

      <section style={{ background: '#fff', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
        {/* Header */}
        <div style={{ padding: '0 20px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 18, background: '#ff6a00', borderRadius: 2 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
              Brands
            </span>
          </div>
          {selectedBrand && (
            <button
              onClick={() => setSelectedBrand(null)}
              aria-label="Clear brand filter"
              style={{
                fontSize: 12, color: '#ff6a00', cursor: 'pointer',
                fontWeight: 600, background: 'none', border: 'none',
                padding: 0, fontFamily: 'inherit',
              }}
            >
              Show All ✕
            </button>
          )}
        </div>

        {/* Scrollable List */}
        <div
          className="brand-scroll"
          role="list"
          style={{
            display: 'flex', gap: 10,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '4px 20px 8px',
          }}
        >
          {/* Shop By Brand Card */}
          <button
            className="shop-by-brand-card"
            onClick={() => router.push('/brands')}
            aria-label="Shop by brand"
            role="listitem"
          >
            <div
              className="shop-inner"
              style={{
                width: 90, height: 72,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #ff6a00, #ff9a44)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                boxShadow: '0 2px 8px rgba(255,106,0,0.2)',
                padding: '8px 6px',
              }}
            >
              <span style={{ fontSize: 20 }}>🏷️</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
                Shop By Brand
              </span>
            </div>
          </button>

          {/* All Card */}
          <button
            className="brand-card"
            onClick={() => setSelectedBrand(null)}
            aria-label="Show all brands"
            aria-pressed={selectedBrand === null}
            role="listitem"
          >
            <div
              className="brand-card-inner"
              style={{
                width: 80, height: 72,
                border: selectedBrand === null ? '2px solid #ff6a00' : '1.5px solid #eee',
                borderRadius: 10,
                background: selectedBrand === null ? '#fff8f5' : '#fafafa',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 22 }}>🏪</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>All</span>
            </div>
          </button>

          {/* Loading Skeletons */}
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              width: 100, height: 72, flexShrink: 0,
              borderRadius: 10, background: '#f0f0f0',
              animation: 'pulse 1.4s ease-in-out infinite',
            }} />
          ))}

          {/* Error */}
          {error && (
            <div style={{ fontSize: 12, color: '#999', padding: '20px 0', alignSelf: 'center' }}>
              Failed to load brands
            </div>
          )}

          {/* Brand Cards */}
          {!loading && !error && filteredBrands.map(brand => (
            <button
              key={brand.id}
              className="brand-card"
              onClick={() => handleSelect(brand.id)}
              aria-label={`Filter by ${brand.name}`}
              aria-pressed={selectedBrand === brand.id}
              role="listitem"
            >
              <div
                className="brand-card-inner"
                style={{
                  width: 100, height: 72,
                  border: selectedBrand === brand.id ? '2px solid #ff6a00' : '1.5px solid #eee',
                  borderRadius: 10,
                  background: selectedBrand === brand.id ? '#fff8f5' : '#fff',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 10px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  position: 'relative',
                }}
              >
                {brand.product_count > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: '#ff6a00', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                    borderRadius: 20, padding: '1px 5px',
                    lineHeight: 1.5,
                  }}>
                    {brand.product_count}
                  </span>
                )}
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  style={{ height: 36, maxWidth: 80, objectFit: 'contain' }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
                <span style={{
                  fontSize: 10, fontWeight: 600, color: '#444',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: 90, textAlign: 'center',
                }}>
                  {brand.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
