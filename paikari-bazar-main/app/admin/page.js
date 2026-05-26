'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardTab from './_components/DashboardTab';
import ProductsTab from './_components/ProductsTab';
import CategoriesTab from './_components/CategoriesTab';
import BrandsTab from './_components/BrandsTab';
import OrdersTab from './_components/OrdersTab';
import UsersTab from './_components/UsersTab';
import DeliveryAreasTab from './_components/DeliveryAreasTab';
import DeliveryChargesTab from './_components/DeliveryChargesTab';
import SalesReportTab from './_components/SalesReportTab';
import WalletTab from './_components/WalletTab';
import PickupPointsTab from './_components/PickupPointsTab';

const TABS = [
  { key: 'dashboard',        label: 'Dashboard',  icon: '🏠' },
  { key: 'products',         label: 'Products',   icon: '📦' },
  { key: 'categories',       label: 'Categories', icon: '🏷️' },
  { key: 'brands',           label: 'Brands',     icon: '🎯' },
  { key: 'orders',           label: 'Orders',     icon: '🛒' },
  { key: 'users',            label: 'Users',      icon: '👥' },
  { key: 'wallet',           label: 'Wallet',     icon: '💳' },
  { key: 'delivery_areas',   label: 'Delivery',   icon: '🗺️' },
  { key: 'delivery_charges', label: 'Charges',    icon: '💰' },
  { key: 'pickup_points',    label: 'Pickup',     icon: '📍' },
  { key: 'sales_report',     label: 'Sales',      icon: '📊' },
];

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || user.role !== 'admin') { router.push('/login'); }
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const FONT = 'var(--font-hind-siliguri), sans-serif';

  return (
    <div style={{ minHeight: '100vh', background: '#0f0e17', fontFamily: FONT, display: 'flex' }}>

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '64px' : '220px',
        background: '#1a1828',
        borderRight: '1px solid rgba(255,255,255,.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .25s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '64px' }}>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', lineHeight: 1.2 }}>পাইকারি</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#818cf8' }}>বাজার</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'rgba(255,255,255,.07)', border: 'none', color: 'rgba(255,255,255,.5)', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {collapsed ? '>' : '<'}
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '8px',
              border: 'none',
              background: tab === key ? 'rgba(129,140,248,.15)' : 'transparent',
              borderLeft: tab === key ? '3px solid #818cf8' : '3px solid transparent',
              color: tab === key ? '#fff' : 'rgba(255,255,255,.45)',
              fontSize: '13px',
              fontWeight: tab === key ? '600' : '400',
              fontFamily: FONT,
              cursor: 'pointer',
              marginBottom: '2px',
              transition: 'all .15s',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
              {!collapsed && label}
            </button>
          ))}
        </nav>

        {/* Bottom: Admin + Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          {!collapsed && (
            <div style={{ padding: '8px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(129,140,248,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#818cf8', fontWeight: '700' }}>A</div>
              <div>
                <div style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>Admin</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.35)' }}>পাইকারি বাজার</div>
              </div>
            </div>
          )}
          <button onClick={logout} style={{
            width: '100%',
            padding: collapsed ? '10px 0' : '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(239,68,68,.1)',
            color: '#f87171',
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: FONT,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
          }}>
            <span>🚪</span>
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '28px', overflowY: 'auto', minHeight: '100vh' }}>
        {tab === 'dashboard'        && <DashboardTab setTab={setTab} />}
        {tab === 'products'         && <ProductsTab />}
        {tab === 'categories'       && <CategoriesTab />}
        {tab === 'brands'           && <BrandsTab />}
        {tab === 'orders'           && <OrdersTab />}
        {tab === 'users'            && <UsersTab />}
        {tab === 'wallet'           && <WalletTab />}
        {tab === 'delivery_areas'   && <DeliveryAreasTab />}
        {tab === 'delivery_charges' && <DeliveryChargesTab />}
        {tab === 'pickup_points'    && <PickupPointsTab />}
        {tab === 'sales_report'     && <SalesReportTab />}
      </main>
    </div>
  );
}
