'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export default function CheckoutPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [note, setNote] = useState('');

  // Pickup state
  const [pickupPoints, setPickupPoints] = useState([]);
  const [selectedPickup, setSelectedPickup] = useState(null);

  const [deliveryOptions, setDeliveryOptions] = useState([
    { id: 'standard',  name: 'স্ট্যান্ডার্ড',    info: '৩-৫ কার্যদিবস', price: 60 },
    { id: 'express',   name: 'এক্সপ্রেস',         info: '১-২ কার্যদিবস', price: 120 },
    { id: 'scheduled', name: 'নির্ধারিত তারিখ',   info: 'তারিখ বেছে নিন', price: 80 },
    { id: 'pickup',    name: 'সেলফ পিকআপ',        info: 'গুদাম থেকে নিন', price: 0 },
  ]);

  const paymentOptions = [
    { id: 'cod',    icon: '💵', name: 'ক্যাশ অন ডেলিভারি' },
    { id: 'wallet', icon: '💳', name: 'ওয়ালেট', balance: walletBalance },
    { id: 'mobile', icon: '📱', name: 'বিকাশ / নগদ' },
    { id: 'bank',   icon: '🏦', name: 'ব্যাংক ট্রান্সফার' },
    { id: 'credit', icon: '📒', name: 'বাকি' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    setUser(u);

    // ✅ FIX: key হলো 'cart', 'paikari_cart' না
    const cart = localStorage.getItem('cart');
    if (cart) setCartItems(JSON.parse(cart));

    Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.delivery_charges&select=value`, { headers: SB_HEADERS })
        .then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${u.id}&select=wallet`, { headers: SB_HEADERS })
        .then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/pickup_points?active=eq.true&order=name`, { headers: SB_HEADERS })
        .then(r => r.json()),
    ]).then(([chargesData, userData, pickupData]) => {
      if (chargesData[0]?.value) {
        const c = chargesData[0].value;
        setDeliveryOptions(prev => prev.map(opt => ({ ...opt, price: c[opt.id] ?? opt.price })));
      }
      if (userData[0]) {
        setWalletBalance(userData[0].wallet || 0);
      }
      if (Array.isArray(pickupData)) {
        setPickupPoints(pickupData);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const deliveryCost = deliveryOptions.find(d => d.id === deliveryMethod)?.price || 0;
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * (item.qty || item.quantity || 1), 0);
  const grandTotal = Math.max(0, subtotal + deliveryCost);
  const walletInsufficient = paymentMethod === 'wallet' && walletBalance < grandTotal;

  async function placeOrder() {
    if (cartItems.length === 0) { alert('কার্টে কোনো পণ্য নেই।'); return; }
    if (deliveryMethod === 'scheduled' && !deliveryDate) {
      alert('অনুগ্রহ করে ডেলিভারি তারিখ বেছে নিন।'); return;
    }
    if (deliveryMethod === 'pickup' && !selectedPickup) {
      alert('অনুগ্রহ করে একটি পিকআপ পয়েন্ট বেছে নিন।'); return;
    }
    if (walletInsufficient) {
      alert(`ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।\nপ্রয়োজন: ৳${grandTotal.toLocaleString()}\nআপনার ব্যালেন্স: ৳${walletBalance.toLocaleString()}`);
      return;
    }

    setPlacing(true);
    try {
      const normalizedItems = cartItems.map(item => ({
        ...item,
        qty: item.qty || item.quantity || 1,
        quantity: item.qty || item.quantity || 1,
      }));

      const selectedPickupPoint = pickupPoints.find(p => p.id === selectedPickup);

      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: { ...SB_HEADERS, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          user_id: user.id,
          shop_name: user.shop_name,
          items: normalizedItems,
          subtotal,
          delivery: deliveryCost,
          total: grandTotal,
          payment_method: paymentMethod,
          delivery_method: deliveryMethod,
          delivery_date: deliveryDate || null,
          pickup_point_id: selectedPickup || null,
          pickup_point_name: selectedPickupPoint?.name || null,
          pickup_point_address: selectedPickupPoint?.address || null,
          note: note || null,
          status: 'pending',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || JSON.stringify(data));

      // wallet payment — balance deduct + transaction
      if (paymentMethod === 'wallet') {
        const newBalance = walletBalance - grandTotal;

        await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
          method: 'PATCH',
          headers: SB_HEADERS,
          body: JSON.stringify({ wallet: newBalance }),
        });

        await fetch(`${SUPABASE_URL}/rest/v1/wallet_transactions`, {
          method: 'POST',
          headers: SB_HEADERS,
          body: JSON.stringify({
            user_id: user.id,
            amount: grandTotal,
            type: 'debit',
            note: `অর্ডার #${String((Array.isArray(data) ? data[0] : data).id).slice(0, 8).toUpperCase()} পেমেন্ট`,
          }),
        });
      }

      // ✅ FIX: 'cart' key দিয়ে clear করতে হবে
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      setOrderSuccess(Array.isArray(data) ? data[0] : data);
    } catch (err) {
      console.error('Order error:', err);
      alert('অর্ডার দেওয়া যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setPlacing(false);
    }
  }

  const s = {
    page: { background: '#f5f5f5', minHeight: '100vh', padding: '24px 16px 60px', fontFamily: 'Hind Siliguri, sans-serif' },
    wrap: { maxWidth: '560px', margin: '0 auto' },
    card: { background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
    label: { color: '#ff6a00', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px', display: 'block' },
    input: { width: '100%', padding: '10px 12px', background: '#f9f9f9', border: '1px solid #eee', borderRadius: '10px', fontSize: '14px', color: '#333', outline: 'none', boxSizing: 'border-box', fontFamily: 'Hind Siliguri, sans-serif' },
  };

  if (orderSuccess) {
    const selectedPickupPoint = pickupPoints.find(p => p.id === selectedPickup);
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '20px', padding: '2.5rem 2rem', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '32px', color: '#22c55e' }}>✓</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>অর্ডার সফল হয়েছে!</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: '0 0 1.5rem', lineHeight: '1.6' }}>
            আপনার অর্ডার গ্রহণ করা হয়েছে। শীঘ্রই আমরা যোগাযোগ করব।
          </p>
          <div style={{ background: '#f9f9f9', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            {orderSuccess.id && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>অর্ডার ID</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#ff6a00', fontFamily: 'monospace' }}>#{String(orderSuccess.id).slice(0, 8).toUpperCase()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>মোট পরিমাণ</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#22c55e' }}>৳{Number(orderSuccess.total || grandTotal).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>পেমেন্ট</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: paymentMethod === 'wallet' ? '#6366f1' : '#ff6a00', background: paymentMethod === 'wallet' ? '#ede9fe' : '#fff3eb', padding: '2px 10px', borderRadius: '20px' }}>
                {paymentMethod === 'wallet' ? '💳 ওয়ালেট' : paymentMethod === 'cod' ? '💵 ক্যাশ' : paymentMethod === 'mobile' ? '📱 মোবাইল' : paymentMethod === 'bank' ? '🏦 ব্যাংক' : '📒 বাকি'}
              </span>
            </div>
            {deliveryMethod === 'pickup' && selectedPickupPoint && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>পিকআপ পয়েন্ট</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#059669' }}>{selectedPickupPoint.name}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>স্ট্যাটাস</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#ff6a00', background: '#fff3eb', padding: '2px 10px', borderRadius: '20px' }}>অপেক্ষমান</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/orders" style={{ display: 'block', background: '#ff6a00', color: '#fff', padding: '13px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>
              অর্ডার দেখুন →
            </Link>
            <Link href="/products" style={{ display: 'block', background: '#f5f5f5', color: '#555', padding: '13px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', textDecoration: 'none' }}>
              আরও কেনাকাটা করুন
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888', fontSize: '14px' }}>লোড হচ্ছে...</p>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        {/* Page title */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>অর্ডার চেকআউট</h1>
          <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0' }}>{cartItems.length}টি পণ্য কার্টে আছে</p>
        </div>

        {/* Delivery Address */}
        <div style={s.card}>
          <span style={s.label}>ডেলিভারি ঠিকানা</span>
          <div style={{ color: '#1a1a1a', fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{user?.shop_name || 'দোকানের নাম নেই'}</div>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '2px' }}>{user?.phone}</div>
          <div style={{ color: '#888', fontSize: '13px', lineHeight: '1.5' }}>
            {user?.address}{user?.thana ? `, ${user.thana}` : ''}{user?.district ? `, ${user.district}` : ''}
          </div>
        </div>

        {/* Delivery Method */}
        <div style={s.card}>
          <span style={s.label}>ডেলিভারি পদ্ধতি</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {deliveryOptions.map(opt => {
              const active = deliveryMethod === opt.id;
              return (
                <div key={opt.id} onClick={() => { setDeliveryMethod(opt.id); setSelectedPickup(null); }} style={{ border: `${active ? '2px solid #ff6a00' : '1px solid #eee'}`, borderRadius: '10px', padding: '10px', cursor: 'pointer', background: active ? '#fff3eb' : '#fff', transition: 'all 0.15s' }}>
                  <div style={{ color: '#1a1a1a', fontSize: '13px', fontWeight: '700', marginBottom: '2px' }}>{opt.name}</div>
                  <div style={{ color: '#999', fontSize: '11px', marginBottom: '4px' }}>{opt.info}</div>
                  <div style={{ color: opt.price === 0 ? '#22c55e' : '#ff6a00', fontSize: '12px', fontWeight: '700' }}>{opt.price === 0 ? 'বিনামূল্যে' : `৳${opt.price}`}</div>
                </div>
              );
            })}
          </div>

          {/* Scheduled date picker */}
          {deliveryMethod === 'scheduled' && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ ...s.label, marginBottom: '6px' }}>ডেলিভারি তারিখ</label>
              <input type="date" style={s.input} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
          )}

          {/* Pickup point selector */}
          {deliveryMethod === 'pickup' && (
            <div style={{ marginTop: '12px' }}>
              <label style={{ ...s.label, marginBottom: '8px' }}>📍 পিকআপ পয়েন্ট বেছে নিন</label>
              {pickupPoints.length === 0 ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#dc2626', textAlign: 'center' }}>
                  কোনো সক্রিয় পিকআপ পয়েন্ট পাওয়া যায়নি
                </div>
              ) : pickupPoints.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPickup(p.id)}
                  style={{
                    border: `${selectedPickup === p.id ? '2px solid #ff6a00' : '1px solid #eee'}`,
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    background: selectedPickup === p.id ? '#fff3eb' : '#fafafa',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: selectedPickup === p.id ? '#ff6a00' : '#1a1a1a' }}>
                          {selectedPickup === p.id ? '🟠' : '⚪'} {p.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.4' }}>{p.address}</div>
                    </div>
                    {p.area && (
                      <span style={{ fontSize: '11px', color: '#ff6a00', background: '#fff3eb', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', border: '1px solid #ffcc99', flexShrink: 0 }}>
                        {p.area}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div style={s.card}>
          <span style={s.label}>অর্ডার সারসংক্ষেপ</span>
          <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '12px' }}>
            {cartItems.length === 0 ? (
              <p style={{ color: '#ccc', fontSize: '13px', textAlign: 'center', padding: '1rem 0' }}>কার্টে কোনো পণ্য নেই</p>
            ) : cartItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <div>
                  <div style={{ color: '#1a1a1a', fontSize: '13px', marginBottom: '1px' }}>{item.name}</div>
                  <div style={{ color: '#999', fontSize: '11px' }}>{item.qty || item.quantity} x ৳{item.price.toLocaleString()}</div>
                </div>
                <div style={{ color: '#ff6a00', fontSize: '13px', fontWeight: '700' }}>৳{(item.price * (item.qty || item.quantity || 1)).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0', color: '#888' }}>
            <span>সাবটোটাল</span><span>৳{subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0', color: '#888' }}>
            <span>ডেলিভারি চার্জ</span><span>{deliveryCost === 0 ? 'বিনামূল্যে' : `৳${deliveryCost}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '700', paddingTop: '10px', borderTop: '1px solid #f0f0f0', marginTop: '8px' }}>
            <span style={{ color: '#1a1a1a' }}>সর্বমোট</span>
            <span style={{ color: '#ff6a00' }}>৳{grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment */}
        <div style={s.card}>
          <span style={s.label}>পেমেন্ট পদ্ধতি</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {paymentOptions.map(opt => {
              const active = paymentMethod === opt.id;
              const isWallet = opt.id === 'wallet';
              const insufficient = isWallet && walletBalance < grandTotal;
              return (
                <div
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id)}
                  style={{
                    border: `${active ? '2px solid #ff6a00' : '1px solid #eee'}`,
                    borderRadius: '10px', padding: '12px', textAlign: 'center',
                    cursor: 'pointer',
                    background: active ? '#fff3eb' : isWallet ? '#faf5ff' : '#fff',
                    transition: 'all 0.15s',
                    opacity: insufficient ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>{opt.icon}</div>
                  <div style={{ color: active ? '#ff6a00' : '#666', fontSize: '12px', fontWeight: '700' }}>{opt.name}</div>
                  {isWallet && (
                    <div style={{ marginTop: '4px', fontSize: '11px', fontWeight: '700', color: insufficient ? '#ef4444' : '#059669' }}>
                      ব্যালেন্স: ৳{walletBalance.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {walletInsufficient && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#dc2626', fontWeight: '600' }}>
              ⚠️ ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। আরও ৳{(grandTotal - walletBalance).toLocaleString()} প্রয়োজন।
            </div>
          )}

          {paymentMethod === 'wallet' && !walletInsufficient && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#059669', fontWeight: '600' }}>
              ✅ পেমেন্টের পর ওয়ালেট ব্যালেন্স: ৳{(walletBalance - grandTotal).toLocaleString()}
            </div>
          )}

          <label style={{ ...s.label, marginBottom: '6px' }}>বিশেষ নোট (ঐচ্ছিক)</label>
          <textarea
            style={{ ...s.input, height: '70px', resize: 'none', marginBottom: '14px' }}
            placeholder="ডেলিভারি বা অর্ডার সম্পর্কে কিছু জানাতে চাইলে লিখুন..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />

          <button
            onClick={placeOrder}
            disabled={placing || walletInsufficient}
            style={{
              width: '100%', padding: '14px',
              background: placing || walletInsufficient ? '#ffb380' : '#ff6a00',
              border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
              color: '#fff', cursor: placing || walletInsufficient ? 'not-allowed' : 'pointer',
              fontFamily: 'Hind Siliguri, sans-serif', transition: 'all 0.2s',
            }}
          >
            {placing ? 'অর্ডার হচ্ছে...' : 'অর্ডার নিশ্চিত করুন →'}
          </button>
        </div>

      </div>
    </div>
  );
}
