'use client';
import { useState, useEffect } from 'react';
import { SUPABASE_URL, headers, s, STATUS_OPTIONS } from './constants';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [userOrders, setUserOrders] = useState({});
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
    loadOrders();
  }, []);

  useEffect(() => {
    if (openMenu === null) return;
    const handleClick = () => setOpenMenu(null);
    // small delay so the button's own click doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [openMenu]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?order=created_at.desc`, { headers });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  const loadOrders = async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=user_id,id,total,status,created_at,shop_name,items`, { headers });
    const orders = await res.json();
    if (!Array.isArray(orders)) return;

    const stats = {};
    const byUser = {};
    orders.forEach(o => {
      if (!o.user_id) return;
      if (!stats[o.user_id]) stats[o.user_id] = { orderCount: 0, totalSpent: 0, lastOrder: null };
      stats[o.user_id].orderCount += 1;
      stats[o.user_id].totalSpent += parseFloat(o.total) || 0;
      if (!stats[o.user_id].lastOrder || new Date(o.created_at) > new Date(stats[o.user_id].lastOrder)) {
        stats[o.user_id].lastOrder = o.created_at;
      }
      if (!byUser[o.user_id]) byUser[o.user_id] = [];
      byUser[o.user_id].push(o);
    });
    setUserStats(stats);
    setUserOrders(byUser);
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`"${name}" কে মুছে ফেলবেন?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, { method: 'DELETE', headers });
      if (res.ok || res.status === 204) {
        showToast(`✅ "${name}" মুছে ফেলা হয়েছে`);
        await loadUsers();
      } else {
        showToast('❌ মুছতে ব্যর্থ হয়েছে', 'error');
      }
    } catch {
      showToast('❌ নেটওয়ার্ক সমস্যা', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleBlock = async (u) => {
    setTogglingId(u.id);
    const newBlocked = !u.is_blocked;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${u.id}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ is_blocked: newBlocked }),
      });
      if (res.ok || res.status === 204) {
        showToast(newBlocked ? `🚫 "${u.name}" ব্লক করা হয়েছে` : `✅ "${u.name}" আনব্লক করা হয়েছে`);
        await loadUsers();
      } else {
        showToast('❌ ব্যর্থ হয়েছে', 'error');
      }
    } catch {
      showToast('❌ নেটওয়ার্ক সমস্যা', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusCfg = (val) => STATUS_OPTIONS.find(s => s.value === val) || { label: val, color: '#888', bg: '#eee' };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.shop_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1.5px solid ${toast.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
          color: toast.type === 'success' ? '#065f46' : '#991b1b',
          padding: '12px 18px', borderRadius: '12px', fontSize: '14px',
          fontFamily: 'Hind Siliguri, sans-serif', fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}>
          {toast.message}
        </div>
      )}

      {/* Profile Modal */}
      {selectedUser && (() => {
        const u = selectedUser;
        const stat = userStats[u.id] || { orderCount: 0, totalSpent: 0, lastOrder: null };
        const orders = [...(userOrders[u.id] || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const isBlocked = u.is_blocked;
        const avatarLetter = u.name?.charAt(0)?.toUpperCase() || '?';
        const joinDate = new Date(u.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
        const [modalTab, setModalTab] = [selectedUser._tab || 'profile', (tab) => setSelectedUser({ ...u, _tab: tab })];

        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={() => setSelectedUser(null)}
          >
            <div
              style={{ background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '480px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Profile Header */}
              <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)', padding: '20px', position: 'relative' }}>
                <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', fontSize: '16px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: isBlocked ? '#fee2e2' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '22px', color: isBlocked ? '#ef4444' : '#fff', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }}>
                    {isBlocked ? '🚫' : avatarLetter}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontWeight: '700', fontSize: '17px', color: '#fff' }}>{u.name || 'অজানা'}</div>
                      {isBlocked && <span style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', background: '#fee2e2', padding: '2px 7px', borderRadius: '6px' }}>ব্লকড</span>}
                    </div>
                    {u.shop_name && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>🏪 {u.shop_name}</div>}
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>যোগ দিয়েছেন {joinDate}</div>
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  {[
                    { label: 'অর্ডার', value: stat.orderCount },
                    { label: 'মোট খরচ', value: `৳${stat.totalSpent.toLocaleString()}` },
                    { label: 'ওয়ালেট', value: `৳${(u.wallet || 0).toLocaleString()}` },
                  ].map(item => (
                    <div key={item.label} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#fff' }}>{item.value}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
                {['profile', 'orders'].map(tab => (
                  <button key={tab} onClick={() => setModalTab(tab)} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: '600', fontFamily: 'Hind Siliguri, sans-serif', border: 'none', cursor: 'pointer', background: 'none', color: modalTab === tab ? '#1e1b4b' : '#9ca3af', borderBottom: modalTab === tab ? '2px solid #1e1b4b' : '2px solid transparent' }}>
                    {tab === 'profile' ? '👤 প্রোফাইল' : `🛒 অর্ডার (${orders.length})`}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>

                {modalTab === 'profile' && (
                  <div>
                    {/* Info rows */}
                    {[
                      { icon: '📞', label: 'ফোন', value: u.phone },
                      { icon: '🏪', label: 'দোকান', value: u.shop_name },
                      { icon: '📍', label: 'ঠিকানা', value: u.address },
                      { icon: '📅', label: 'যোগ দিয়েছেন', value: joinDate },
                      { icon: '👛', label: 'ওয়ালেট', value: u.wallet > 0 ? `৳${u.wallet.toLocaleString()}` : null },
                    ].filter(r => r.value).map(row => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f9fafb' }}>
                        <span style={{ fontSize: '16px', width: '24px', textAlign: 'center' }}>{row.icon}</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af', width: '60px', flexShrink: 0 }}>{row.label}</span>
                        <span style={{ fontSize: '13px', color: '#111827', fontWeight: '600' }}>{row.value}</span>
                      </div>
                    ))}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button
                        onClick={() => { toggleBlock(u); setSelectedUser({ ...u, is_blocked: !isBlocked, _tab: 'profile' }); }}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1.5px solid ${isBlocked ? '#bbf7d0' : '#fde68a'}`, background: isBlocked ? '#f0fdf4' : '#fefce8', color: isBlocked ? '#15803d' : '#92400e', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif' }}>
                        {isBlocked ? '✅ আনব্লক করুন' : '🚫 ব্লক করুন'}
                      </button>
                      <button
                        onClick={() => { setSelectedUser(null); deleteUser(u.id, u.name); }}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif' }}>
                        🗑️ মুছুন
                      </button>
                    </div>
                  </div>
                )}

                {modalTab === 'orders' && (
                  <div>
                    {orders.length === 0 ? (
                      <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>কোনো অর্ডার নেই</p>
                    ) : orders.map(o => {
                      const st = getStatusCfg(o.status);
                      const items = Array.isArray(o.items) ? o.items : [];
                      const date = new Date(o.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
                      return (
                        <div key={o.id} style={{ border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div>
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6b7280' }}>#{o.id?.slice(0, 8)?.toUpperCase()}</span>
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{date}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: st.bg, color: st.color }}>{st.label}</span>
                              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e1b4b' }}>৳{Number(o.total || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          {items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#374151', padding: '3px 0', borderTop: idx === 0 ? '1px solid #f3f4f6' : 'none' }}>
                              <span>{item.name} × {item.qty || item.quantity || 1}</span>
                              <span style={{ fontWeight: '600' }}>৳{Number(item.price * (item.qty || item.quantity || 1)).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1e1b4b' }}>
        গ্রাহক তালিকা ({users.length})
      </h2>

      <div style={{ marginBottom: '16px' }}>
        <input
          style={{ ...s.inp, maxWidth: '360px' }}
          placeholder="🔍 নাম, ফোন বা দোকান খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredUsers.length === 0 && (
          <p style={{ color: '#6b7280', fontSize: '13px' }}>কোনো গ্রাহক নেই</p>
        )}

        {filteredUsers.map(u => {
          const stat = userStats[u.id] || { orderCount: 0, totalSpent: 0, lastOrder: null };
          const joinDate = new Date(u.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
          const lastOrderDate = stat.lastOrder
            ? new Date(stat.lastOrder).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })
            : null;
          const isDeleting = deletingId === u.id;
          const isToggling = togglingId === u.id;
          const isBlocked = u.is_blocked;
          const avatarLetter = u.name?.charAt(0)?.toUpperCase() || '?';

          return (
            <div key={u.id} style={{
              background: isBlocked ? '#fef2f2' : '#fff',
              border: `1.5px solid ${isBlocked ? '#fecaca' : '#e5e7eb'}`,
              borderRadius: '12px', padding: '14px 16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              opacity: (isDeleting || isToggling) ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: isBlocked ? '#fee2e2' : '#ede9fe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: '17px',
                    color: isBlocked ? '#ef4444' : '#6366f1', flexShrink: 0,
                  }}>
                    {isBlocked ? '🚫' : avatarLetter}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>
                        {u.name || 'অজানা'}
                      </div>
                      {isBlocked && (
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', background: '#fee2e2', padding: '1px 6px', borderRadius: '6px' }}>
                          ব্লকড
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>
                      📞 {u.phone}
                      {u.shop_name && <span style={{ marginLeft: '8px' }}>🏪 {u.shop_name}</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                      যোগ দিয়েছেন: {joinDate}
                    </div>
                  </div>
                </div>

                {/* Action menu */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                    style={{
                      background: '#f3f4f6', border: '1.5px solid #e5e7eb',
                      color: '#374151', borderRadius: '8px',
                      width: '34px', height: '34px', fontSize: '18px',
                      cursor: 'pointer', fontWeight: '700',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    ⋯
                  </button>
                  {openMenu === u.id && (
                    <div style={{
                      position: 'absolute', right: 0, top: '40px', zIndex: 200,
                      background: '#fff', border: '1.5px solid #e5e7eb',
                      borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      minWidth: '150px', overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => { setOpenMenu(null); setSelectedUser(u); }}
                        style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none',
                          color: '#1e1b4b', padding: '10px 14px', fontSize: '13px',
                          cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif', fontWeight: '600',
                          borderBottom: '1px solid #f3f4f6',
                        }}>
                        🛒 অর্ডার দেখুন
                      </button>
                      <button
                        onClick={() => { setOpenMenu(null); toggleBlock(u); }}
                        disabled={isToggling}
                        style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none',
                          color: isBlocked ? '#059669' : '#d97706', padding: '10px 14px',
                          fontSize: '13px', cursor: 'pointer',
                          fontFamily: 'Hind Siliguri, sans-serif', fontWeight: '600',
                          borderBottom: '1px solid #f3f4f6',
                        }}>
                        {isBlocked ? '✅ আনব্লক করুন' : '🚫 ব্লক করুন'}
                      </button>
                      <button
                        onClick={() => { setOpenMenu(null); deleteUser(u.id, u.name); }}
                        disabled={isDeleting}
                        style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none',
                          color: '#ef4444', padding: '10px 14px', fontSize: '13px',
                          cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif', fontWeight: '600',
                        }}>
                        🗑️ মুছুন
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <div
                  onClick={() => setSelectedUser(u)}
                  style={{
                    background: '#f0f9ff', border: '1px solid #bae6fd',
                    borderRadius: '8px', padding: '5px 10px',
                    fontSize: '12px', color: '#0369a1', fontWeight: '600', cursor: 'pointer',
                  }}>
                  🛒 {stat.orderCount} টি অর্ডার
                </div>
                {stat.totalSpent > 0 && (
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '8px', padding: '5px 10px',
                    fontSize: '12px', color: '#15803d', fontWeight: '600',
                  }}>
                    💰 ৳{stat.totalSpent.toLocaleString()}
                  </div>
                )}
                {u.wallet > 0 && (
                  <div style={{
                    background: '#fefce8', border: '1px solid #fde68a',
                    borderRadius: '8px', padding: '5px 10px',
                    fontSize: '12px', color: '#92400e', fontWeight: '600',
                  }}>
                    👛 ওয়ালেট ৳{u.wallet}
                  </div>
                )}
                {lastOrderDate && (
                  <div style={{
                    background: '#faf5ff', border: '1px solid #e9d5ff',
                    borderRadius: '8px', padding: '5px 10px',
                    fontSize: '12px', color: '#7e22ce', fontWeight: '600',
                  }}>
                    🕐 সর্বশেষ: {lastOrderDate}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
