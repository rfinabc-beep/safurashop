'use client';
import { useState, useEffect } from 'react';
import { SUPABASE_URL, headers, STATUS_OPTIONS } from './constants';

export default function DashboardTab({ setTab }) {
  const [stats, setStats] = useState({ orders: 0, products: 0, users: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [recentRes, allOrdersRes, productsRes, usersRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/orders?select=id,total,status,created_at,shop_name&order=created_at.desc&limit=5`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/orders?select=id,total`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/products?select=id`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/users?select=id`, { headers }),
      ]);

      const recent = await recentRes.json();
      const allOrders = await allOrdersRes.json();
      const products = await productsRes.json();
      const users = await usersRes.json();

      const revenue = Array.isArray(allOrders)
        ? allOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
        : 0;

      setStats({
        orders: Array.isArray(allOrders) ? allOrders.length : 0,
        products: Array.isArray(products) ? products.length : 0,
        users: Array.isArray(users) ? users.length : 0,
        revenue,
      });

      setRecentOrders(Array.isArray(recent) ? recent : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'মোট অর্ডার', value: stats.orders, icon: '🛒', color: '#818cf8', bg: 'rgba(129,140,248,.12)' },
    { label: 'মোট পণ্য', value: stats.products, icon: '📦', color: '#34d399', bg: 'rgba(52,211,153,.12)' },
    { label: 'মোট গ্রাহক', value: stats.users, icon: '👥', color: '#fbbf24', bg: 'rgba(251,191,36,.12)' },
    { label: 'মোট বিক্রি', value: `৳${stats.revenue.toLocaleString('bn-BD')}`, icon: '💰', color: '#f472b6', bg: 'rgba(244,114,182,.12)' },
  ];

  const getStatus = (val) => STATUS_OPTIONS.find(s => s.value === val) || { label: val, color: '#888', bg: '#eee' };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
      <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '14px', fontFamily: 'Hind Siliguri, sans-serif' }}>লোড হচ্ছে…</div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: 0, marginBottom: '4px' }}>ড্যাশবোর্ড</h1>
        <p style={{ color: 'rgba(255,255,255,.35)', fontSize: '13px', margin: 0 }}>পাইকারি বাজার — অ্যাডমিন প্যানেল</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {statCards.map(({ label, value, icon, color, bg }) => (
          <div key={label} style={{
            background: '#1a1828',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color, lineHeight: 1.2 }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)', marginTop: '2px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{ background: '#1a1828', borderRadius: '14px', border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: '700', margin: 0 }}>সাম্প্রতিক অর্ডার</h2>
          <button onClick={() => setTab('orders')} style={{ background: 'rgba(129,140,248,.15)', border: 'none', color: '#818cf8', fontSize: '12px', fontWeight: '600', fontFamily: 'Hind Siliguri, sans-serif', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            সব দেখো →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: '13px' }}>কোনো অর্ডার নেই</div>
        ) : (
          <div>
            {recentOrders.map((order, i) => {
              const st = getStatus(order.status);
              return (
                <div key={order.id} style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', fontSize: '11px', fontWeight: '700' }}>
                      #{i + 1}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                        {order.shop_name || `অর্ডার #${String(order.id).slice(-6)}`}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,.3)', fontSize: '11px', marginTop: '2px' }}>
                        {new Date(order.created_at).toLocaleDateString('bn-BD')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#34d399' }}>
                      ৳{parseFloat(order.total || 0).toLocaleString('bn-BD')}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: st.color, background: st.bg, padding: '3px 10px', borderRadius: '20px' }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { label: 'পণ্য যোগ করো', icon: '➕', tab: 'products', color: '#818cf8' },
          { label: 'ক্যাটাগরি', icon: '🏷️', tab: 'categories', color: '#34d399' },
          { label: 'অর্ডার দেখো', icon: '🛒', tab: 'orders', color: '#fbbf24' },
          { label: 'গ্রাহক দেখো', icon: '👥', tab: 'users', color: '#f472b6' },
        ].map(({ label, icon, tab, color }) => (
          <button key={tab} onClick={() => setTab(tab)} style={{
            background: '#1a1828',
            border: '1px solid rgba(255,255,255,.06)',
            borderRadius: '12px',
            padding: '16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            transition: 'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = color}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)'}
          >
            <span style={{ fontSize: '22px' }}>{icon}</span>
            <span style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px', fontWeight: '600', fontFamily: 'Hind Siliguri, sans-serif' }}>{label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
