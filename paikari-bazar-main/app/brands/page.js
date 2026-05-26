'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
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

  const filtered = useMemo(() =>
    brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase())),
    [brands, search]
  );

  return (
    <>
      <style>{`
        .brand-grid-card {
          cursor: pointer;
          border: 1.5px solid #eee;
          border-radius: 12px;
          background: #fff;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          transition: all 0.2s ease;
          position: relative;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .brand-grid-card:hover {
          border-color: #ff6a00;
          box-shadow: 0 6px 20px rgba(255,106,0,0.15);
          transform: translateY(-3px);
        }
        .search-input:focus {
          outline: none;
          border-color: #ff6a00;
          box-shadow: 0 0 0 3px rgba(255,106,0,0.1);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .brand-grid-card { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        {/* Header */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '16px 20px',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 20, padding: 0, color: '#333',
                display: 'flex', alignItems: 'center',
              }}
            >
              ←
            </button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                All Brands
              </h1>
              {!loading && (
                <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                  {filtered.length} brand{filtered.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          <input
            className="search-input"
            type="text"
            placeholder="Search brands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid #eee',
              fontSize: 14,
              color: '#1a1a1a',
              background: '#fafafa',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: 16 }}>
          {/* Loading */}
          {loading && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{
                  height: 120, borderRadius: 12,
                  background: '#f0f0f0',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.08}s`,
                }} />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ fontSize: 14 }}>Failed to load brands. Please try again.</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 12, padding: '8px 20px',
                  background: '#ff6a00', color: '#fff',
                  border: 'none', borderRadius: 8,
                  fontSize: 13, cursor: 'pointer', fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 14 }}>No brands found for "{search}"</p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && filtered.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}>
              {filtered.map((brand, i) => (
                <button
                  key={brand.id}
                  className="brand-grid-card"
                  onClick={() => router.push(`/products?brand=${brand.id}`)}
                  aria-label={`View products from ${brand.name}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {brand.product_count > 0 && (
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      background: '#ff6a00', color: '#fff',
                      fontSize: 9, fontWeight: 700,
                      borderRadius: 20, padding: '2px 6px',
                      lineHeight: 1.5,
                    }}>
                      {brand.product_count}
                    </span>
                  )}
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    style={{ height: 48, maxWidth: '100%', objectFit: 'contain' }}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#333',
                    textAlign: 'center', lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    width: '100%',
                  }}>
                    {brand.name}
                  </span>
                  {brand.product_count > 0 && (
                    <span style={{ fontSize: 10, color: '#999' }}>
                      {brand.product_count} product{brand.product_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
