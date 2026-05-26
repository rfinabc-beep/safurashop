'use client';
import { useState, useEffect } from 'react';
import { SUPABASE_URL, SUPABASE_KEY, headers } from './constants';

// ─── Styles ───────────────────────────────────────────────────
const st = {
  card: { background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
  label: { fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  btn: { padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  inp: { background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#e2e8f0', fontSize: '13px', outline: 'none' },
};

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const REVENUE_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'];

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n) {
  if (n >= 100000) return '৳' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '৳' + (n / 1000).toFixed(1) + 'k';
  return '৳' + n;
}

function fmtFull(n) {
  return '৳' + Number(n || 0).toLocaleString('en-BD');
}

function getDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function getToday() { return new Date().toISOString().slice(0, 10); }

function groupByDate(orders, dateField = 'created_at') {
  const map = {};
  orders.forEach(o => {
    const day = (o[dateField] || '').slice(0, 10);
    if (!map[day]) map[day] = { date: day, revenue: 0, orders: 0 };
    map[day].revenue += Number(o.total || o.total_price || 0);
    map[day].orders += 1;
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

function fillDateRange(data, from, to) {
  const map = {};
  data.forEach(d => { map[d.date] = d; });
  const result = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    const day = cur.toISOString().slice(0, 10);
    result.push(map[day] || { date: day, revenue: 0, orders: 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

// ─── Mini Bar Chart ───────────────────────────────────────────
function BarChart({ data, valueKey = 'revenue', color = '#f59e0b', height = 140 }) {
  if (!data || data.length === 0) return <div style={{ color: '#475569', fontSize: '13px', padding: '20px', textAlign: 'center' }}>No data</div>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const barW = Math.max(6, Math.min(32, Math.floor(560 / data.length) - 4));

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: `${height}px`, minWidth: `${data.length * (barW + 4)}px`, padding: '0 4px' }}>
        {data.map((d, i) => {
          const h = Math.max(2, Math.round((d[valueKey] / max) * (height - 20)));
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: barW }} title={`${d.date}: ${valueKey === 'revenue' ? fmtFull(d[valueKey]) : d[valueKey]}`}>
              <div style={{ width: '100%', height: `${h}px`, background: color, borderRadius: '4px 4px 0 0', opacity: 0.85, transition: 'opacity 0.2s' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', marginTop: '4px', padding: '0 4px' }}>
        <span>{data[0]?.date?.slice(5)}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.date?.slice(5)}</span>}
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = '#f59e0b' }) {
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '16px 20px' }}>
      <div style={{ fontSize: '22px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '22px', fontWeight: '800', color, marginBottom: '2px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function SalesReportTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(getDaysAgo(29));
  const [dateTo, setDateTo] = useState(getToday());
  const [activeRange, setActiveRange] = useState('30d');
  const [chartMode, setChartMode] = useState('revenue'); // revenue | orders

  useEffect(() => { loadOrders(); }, [dateFrom, dateTo]);

  const loadOrders = async () => {
    setLoading(true);
    const from = new Date(dateFrom).toISOString();
    const to = new Date(dateTo + 'T23:59:59').toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?created_at=gte.${from}&created_at=lte.${to}&order=created_at.desc`,
      { headers }
    );
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const setRange = (key) => {
    setActiveRange(key);
    const today = getToday();
    if (key === '7d') { setDateFrom(getDaysAgo(6)); setDateTo(today); }
    if (key === '30d') { setDateFrom(getDaysAgo(29)); setDateTo(today); }
    if (key === '90d') { setDateFrom(getDaysAgo(89)); setDateTo(today); }
    if (key === 'custom') { /* keep current */ }
  };

  // ─── Computed Stats ─────────────────────────────────────────
  const revenueOrders = orders.filter(o => REVENUE_STATUSES.includes(o.status));
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const pendingOrders = orders.filter(o => o.status === 'pending');

  const totalRevenue = revenueOrders.reduce((s, o) => s + Number(o.total || o.total_price || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = revenueOrders.length ? totalRevenue / revenueOrders.length : 0;
  const cancelRate = totalOrders ? ((cancelledOrders.length / totalOrders) * 100).toFixed(1) : 0;

  // ─── Status Breakdown ───────────────────────────────────────
  const statusBreakdown = STATUSES.map(status => ({
    status,
    count: orders.filter(o => o.status === status).length,
    revenue: orders.filter(o => o.status === status).reduce((s, o) => s + Number(o.total || o.total_price || 0), 0),
  }));

  // ─── Chart Data ─────────────────────────────────────────────
  const dailyRaw = groupByDate(revenueOrders);
  const dailyData = fillDateRange(dailyRaw, dateFrom, dateTo);
  const dailyAllRaw = groupByDate(orders);
  const dailyAllData = fillDateRange(dailyAllRaw, dateFrom, dateTo);

  // ─── Top Products ───────────────────────────────────────────
  const productMap = {};
  revenueOrders.forEach(o => {
    let items = [];
    try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch {}
    items.forEach(item => {
      const key = item.name || item.product_name || item.id || 'Unknown';
      if (!productMap[key]) productMap[key] = { name: key, qty: 0, revenue: 0 };
      productMap[key].qty += Number(item.quantity || item.qty || 0);
      productMap[key].revenue += Number(item.price || 0) * Number(item.quantity || item.qty || 0);
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const maxProductRevenue = Math.max(...topProducts.map(p => p.revenue), 1);

  // ─── Export CSV ─────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [['Order ID', 'Date', 'Status', 'Total', 'Phone']];
    orders.forEach(o => rows.push([
      o.id, (o.created_at || '').slice(0, 10), o.status,
      o.total || o.total_price || 0, o.phone || '',
    ]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sales_report_${dateFrom}_${dateTo}.csv`;
    a.click();
  };

  const statusColors = {
    pending: '#f59e0b', confirmed: '#60a5fa', processing: '#a78bfa',
    shipped: '#34d399', delivered: '#4ade80', cancelled: '#f87171',
  };

  const rangeTabs = [
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: '90d', label: 'Last 90 Days' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>📊 Sales Report</h2>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
            {dateFrom} → {dateTo}
            {loading && <span style={{ marginLeft: '8px', color: '#f59e0b' }}>Loading...</span>}
          </div>
        </div>
        <button onClick={exportCSV} style={{ ...st.btn, background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', fontSize: '12px' }}>
          📤 Export CSV
        </button>
      </div>

      {/* Date Range Tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {rangeTabs.map(tab => (
          <button key={tab.key} onClick={() => setRange(tab.key)} style={{
            ...st.btn,
            background: activeRange === tab.key ? '#f59e0b' : '#0f172a',
            color: activeRange === tab.key ? '#0f172a' : '#64748b',
            border: `1px solid ${activeRange === tab.key ? '#f59e0b' : '#334155'}`,
            padding: '6px 14px', fontSize: '12px', fontWeight: activeRange === tab.key ? '700' : '500',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Custom Date Range */}
      {activeRange === 'custom' && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={st.label}>From</label>
            <input type="date" style={st.inp} value={dateFrom} max={dateTo} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={st.label}>To</label>
            <input type="date" style={st.inp} value={dateTo} min={dateFrom} max={getToday()} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon="💰" label="Total Revenue" value={fmt(totalRevenue)} sub={fmtFull(totalRevenue)} color="#f59e0b" />
        <StatCard icon="📦" label="Total Orders" value={totalOrders} sub={`${revenueOrders.length} revenue orders`} color="#60a5fa" />
        <StatCard icon="🛒" label="Avg Order Value" value={fmt(Math.round(avgOrderValue))} sub="from confirmed orders" color="#a78bfa" />
        <StatCard icon="✅" label="Delivered" value={orders.filter(o => o.status === 'delivered').length} sub="completed orders" color="#4ade80" />
        <StatCard icon="⏳" label="Pending" value={pendingOrders.length} sub="awaiting action" color="#fbbf24" />
        <StatCard icon="❌" label="Cancel Rate" value={`${cancelRate}%`} sub={`${cancelledOrders.length} cancelled`} color="#f87171" />
      </div>

      {/* Revenue Chart */}
      <div style={st.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>
            {chartMode === 'revenue' ? '📈 Daily Revenue' : '📦 Daily Orders'}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['revenue', 'orders'].map(mode => (
              <button key={mode} onClick={() => setChartMode(mode)} style={{
                ...st.btn,
                background: chartMode === mode ? '#f59e0b' : '#0f172a',
                color: chartMode === mode ? '#0f172a' : '#64748b',
                border: `1px solid ${chartMode === mode ? '#f59e0b' : '#334155'}`,
                padding: '5px 12px', fontSize: '11px', fontWeight: chartMode === mode ? '700' : '500', textTransform: 'capitalize',
              }}>{mode}</button>
            ))}
          </div>
        </div>

        {chartMode === 'revenue'
          ? <BarChart data={dailyData} valueKey="revenue" color="#f59e0b" />
          : <BarChart data={dailyAllData} valueKey="orders" color="#60a5fa" />
        }

        {/* Summary below chart */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #334155', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Peak day: <strong style={{ color: '#f59e0b' }}>
              {dailyData.reduce((best, d) => d.revenue > best.revenue ? d : best, { revenue: 0, date: '-' }).date}
            </strong>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Avg/day: <strong style={{ color: '#f1f5f9' }}>
              {fmtFull(Math.round(totalRevenue / Math.max(dailyData.length, 1)))}
            </strong>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={st.card}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px' }}>📋 Order Status Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {statusBreakdown.map(({ status, count, revenue }) => {
            const pct = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
            const color = statusColors[status] || '#94a3b8';
            return (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#e2e8f0', textTransform: 'capitalize', fontWeight: '600' }}>{status}</span>
                    <span style={{ fontSize: '11px', color: '#475569' }}>{count} orders</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {revenue > 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>{fmtFull(revenue)}</span>}
                    <span style={{ fontSize: '12px', color, fontWeight: '700' }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: '6px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products */}
      <div style={st.card}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px' }}>🏆 Top Products by Revenue</div>
        {topProducts.length === 0 && (
          <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
            No product data found in orders.<br />
            <span style={{ fontSize: '11px' }}>Make sure order items are stored as JSON in the <code>items</code> field.</span>
          </div>
        )}
        {topProducts.map((p, i) => {
          const pct = Math.round((p.revenue / maxProductRevenue) * 100);
          return (
            <div key={p.name} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', width: '18px' }}>#{i + 1}</span>
                  <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>{p.name}</span>
                  <span style={{ fontSize: '11px', color: '#475569' }}>×{p.qty} units</span>
                </div>
                <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '700' }}>{fmtFull(p.revenue)}</span>
              </div>
              <div style={{ height: '5px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: '4px', opacity: 0.7 + (0.3 * (1 - i / topProducts.length)) }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Table */}
      <div style={st.card}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px' }}>
          🕐 Recent Orders
          <span style={{ fontSize: '11px', color: '#475569', fontWeight: '400', marginLeft: '8px' }}>last 20</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Order ID', 'Date', 'Phone', 'Status', 'Total'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 20).map(o => {
                const color = statusColors[o.status] || '#94a3b8';
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid #0f172a' }}>
                    <td style={{ padding: '8px 10px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                      {String(o.id).slice(0, 8)}...
                    </td>
                    <td style={{ padding: '8px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {(o.created_at || '').slice(0, 10)}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#e2e8f0' }}>{o.phone || '-'}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#f59e0b', fontWeight: '700' }}>
                      {fmtFull(o.total || o.total_price || 0)}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#475569' }}>No orders in this date range</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
