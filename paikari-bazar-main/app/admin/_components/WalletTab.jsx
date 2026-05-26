'use client';
import { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from './constants';

const FONT = "'Hind Siliguri', sans-serif";

export default function WalletTab() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('credit');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const showToast = (message, ok = true) => {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    const [uRes, tRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/users?order=created_at.desc&select=id,name,phone,shop_name,wallet`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/wallet_transactions?order=created_at.desc&select=*`, { headers }),
    ]);
    const [u, t] = await Promise.all([uRes.json(), tRes.json()]);
    setUsers(Array.isArray(u) ? u : []);
    setTransactions(Array.isArray(t) ? t : []);
    setLoading(false);
  };

  const userTx = (uid) => transactions.filter(t => t.user_id === uid);

  const handleSubmit = async () => {
    if (!selectedUser || !amount || Number(amount) <= 0) return;
    setSaving(true);
    const amt = Number(amount);
    const newWallet = type === 'credit'
      ? (selectedUser.wallet || 0) + amt
      : Math.max(0, (selectedUser.wallet || 0) - amt);

    try {
      // Update wallet balance
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${selectedUser.id}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ wallet: newWallet }),
      });

      // Insert transaction
      await fetch(`${SUPABASE_URL}/rest/v1/wallet_transactions`, {
        method: 'POST', headers,
        body: JSON.stringify({
          user_id: selectedUser.id,
          amount: amt,
          type,
          note: note || null,
        }),
      });

      showToast(type === 'credit' ? `✅ ৳${amt} যোগ করা হয়েছে` : `✅ ৳${amt} কাটা হয়েছে`);
      setAmount('');
      setNote('');
      setSelectedUser({ ...selectedUser, wallet: newWallet });
      await loadData();
    } catch {
      showToast('❌ সমস্যা হয়েছে', false);
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.shop_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalWallet = users.reduce((s, u) => s + (u.wallet || 0), 0);

  return (
    <div style={{ fontFamily: FONT, position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.ok ? '#ecfdf5' : '#fef2f2',
          border: `1.5px solid ${toast.ok ? '#6ee7b7' : '#fca5a5'}`,
          color: toast.ok ? '#065f46' : '#991b1b',
          padding: '12px 18px', borderRadius: '12px', fontSize: '14px',
          fontFamily: FONT, fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}>{toast.message}</div>
      )}

      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e1b4b', marginBottom: '16px' }}>
        💰 ওয়ালেট ম্যানেজমেন্ট
      </h2>

      {/* Summary card */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #3730a3)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>মোট ওয়ালেট ব্যালেন্স</div>
          <div style={{ color: '#fff', fontSize: '22px', fontWeight: '700' }}>৳{totalWallet.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>মোট গ্রাহক</div>
          <div style={{ color: '#fff', fontSize: '22px', fontWeight: '700' }}>{users.length}</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>মোট লেনদেন</div>
          <div style={{ color: '#fff', fontSize: '22px', fontWeight: '700' }}>{transactions.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Left: User list */}
        <div style={{ flex: '1 1 300px' }}>
          <input
            placeholder="🔍 নাম, ফোন বা দোকান..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '13px', marginBottom: '12px', fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }}
          />

          {loading ? (
            <p style={{ color: '#9ca3af', fontSize: '13px' }}>লোড হচ্ছে...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(u => (
                <div
                  key={u.id}
                  onClick={() => { setSelectedUser(u); setAmount(''); setNote(''); setType('credit'); }}
                  style={{
                    background: selectedUser?.id === u.id ? '#ede9fe' : '#fff',
                    border: `1.5px solid ${selectedUser?.id === u.id ? '#6366f1' : '#e5e7eb'}`,
                    borderRadius: '10px', padding: '12px 14px',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        📞 {u.phone}
                        {u.shop_name && <span style={{ marginLeft: '8px' }}>🏪 {u.shop_name}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: (u.wallet || 0) > 0 ? '#059669' : '#9ca3af' }}>
                        ৳{(u.wallet || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>{userTx(u.id).length} লেনদেন</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Action panel */}
        {selectedUser && (
          <div style={{ flex: '1 1 280px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #3730a3)', padding: '16px 20px' }}>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{selectedUser.name}</div>
              {selectedUser.shop_name && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>🏪 {selectedUser.shop_name}</div>}
              <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 14px', display: 'inline-block' }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>বর্তমান ব্যালেন্স</div>
                <div style={{ color: '#fff', fontSize: '22px', fontWeight: '700' }}>৳{(selectedUser.wallet || 0).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>

              {/* Type toggle */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {[{ v: 'credit', label: '+ যোগ করুন', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
                  { v: 'debit', label: '− কাটুন', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => setType(opt.v)}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '9px',
                      border: `1.5px solid ${type === opt.v ? opt.border : '#e5e7eb'}`,
                      background: type === opt.v ? opt.bg : '#f9fafb',
                      color: type === opt.v ? opt.color : '#9ca3af',
                      fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: FONT,
                    }}
                  >{opt.label}</button>
                ))}
              </div>

              {/* Amount */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '5px' }}>পরিমাণ (৳)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '16px', fontWeight: '700', fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* Note */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '5px' }}>নোট (ঐচ্ছিক)</label>
                <input
                  placeholder="কারণ লিখুন..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '13px', fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving || !amount || Number(amount) <= 0}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                  background: saving || !amount ? '#e5e7eb' : type === 'credit' ? '#059669' : '#dc2626',
                  color: saving || !amount ? '#9ca3af' : '#fff',
                  fontWeight: '700', fontSize: '14px', cursor: saving || !amount ? 'not-allowed' : 'pointer',
                  fontFamily: FONT,
                }}
              >
                {saving ? 'প্রসেস হচ্ছে...' : type === 'credit' ? `৳${amount || 0} যোগ করুন` : `৳${amount || 0} কাটুন`}
              </button>

              {/* Transaction history */}
              {userTx(selectedUser.id).length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>লেনদেনের ইতিহাস</div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {userTx(selectedUser.id).map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: t.type === 'credit' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${t.type === 'credit' ? '#bbf7d0' : '#fecaca'}` }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: t.type === 'credit' ? '#059669' : '#dc2626' }}>
                            {t.type === 'credit' ? '+ যোগ' : '− কাটা'}
                          </div>
                          {t.note && <div style={{ fontSize: '11px', color: '#6b7280' }}>{t.note}</div>}
                          <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                            {new Date(t.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: t.type === 'credit' ? '#059669' : '#dc2626' }}>
                          {t.type === 'credit' ? '+' : '-'}৳{Number(t.amount).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
