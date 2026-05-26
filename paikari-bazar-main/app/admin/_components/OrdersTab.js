'use client';
import { useState, useEffect } from 'react';
import { SUPABASE_URL, headers, STATUS_OPTIONS, s } from './constants';

// ─── Timeline Config ──────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { value: 'pending',    label: 'অর্ডার দেওয়া হয়েছে', icon: '📋', step: 1 },
  { value: 'confirmed', label: 'প্রক্রিয়াধীন',         icon: '⚙️', step: 2 },
  { value: 'shipped',   label: 'মাল পাঠানো হয়েছে',    icon: '🚚', step: 3 },
  { value: 'delivered', label: 'ডেলিভারি সম্পন্ন',    icon: '✅', step: 4 },
];
const STEP_ORDER = ['pending', 'confirmed', 'shipped', 'delivered'];

function getStepIndex(status) {
  const idx = STEP_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

// ─── tracking_history helpers ─────────────────────────────────────────────────
// tracking_history is an array of { status, note, time } objects in DB
function getHistoryEntry(trackingHistory, stepValue) {
  if (!Array.isArray(trackingHistory)) return null;
  return trackingHistory.find(h => h.status === stepValue) || null;
}

// ─── Tracking Timeline Modal ──────────────────────────────────────────────────
function TrackingModal({ order, onClose, onUpdateStatus, onSaveNote, isUpdating }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const userInfo = order.users || {};
  const currentStepIdx = getStepIndex(order.status);
  const phone = userInfo.phone || order.phone || '';
  const address = order.address || order.delivery_address || '';
  const trackingHistory = Array.isArray(order.tracking_history) ? order.tracking_history : [];

  const [editingNote, setEditingNote] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const saveNote = async (stepValue) => {
    setSavingNote(true);
    await onSaveNote(order.id, stepValue, noteInput.trim(), trackingHistory);
    setEditingNote(null);
    setNoteInput('');
    setSavingNote(false);
  };

  const formatDateTime = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString('bn-BD', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        fontFamily: 'Hind Siliguri, sans-serif',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
          borderRadius: '20px 20px 0 0', padding: '20px 24px', color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>
                অর্ডার #{order.id?.slice(0, 8)?.toUpperCase()}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>
                {order.shop_name || userInfo.shop_name || 'অজানা'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {formatDateTime(order.created_at)} · {items.length} টি পণ্য · ৳{Number(order.total || 0).toLocaleString()}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>

          {(() => {
            const cfg = STATUS_OPTIONS.find(s => s.value === order.status) || STATUS_OPTIONS[0];
            return (
              <div style={{
                display: 'inline-block', marginTop: '12px',
                background: cfg.bg, color: cfg.color,
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
              }}>{cfg.label}</div>
            );
          })()}
        </div>

        <div style={{ padding: '24px' }}>

          {/* ── Timeline ── */}
          <div style={{ marginBottom: '24px' }}>
            {TIMELINE_STEPS.map((step, idx) => {
              const isDone = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isPending = idx > currentStepIdx;
              const isLast = idx === TIMELINE_STEPS.length - 1;

              // Get note & time from DB tracking_history
              const histEntry = getHistoryEntry(trackingHistory, step.value);
              const noteText = histEntry?.note || '';
              const stepTime = histEntry?.time || null;

              // fallback: pending step uses created_at, current step uses updated_at
              const displayTime = stepTime
                ? stepTime
                : isCurrent
                  ? (order.updated_at || order.created_at)
                  : idx === 0
                    ? order.created_at
                    : null;

              const isEditingThis = editingNote === step.value;

              return (
                <div key={step.value} style={{ display: 'flex', gap: '16px' }}>
                  {/* Icon + connector line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', flexShrink: 0 }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isCurrent ? '18px' : '16px',
                      background: isCurrent ? '#f59e0b' : isDone ? '#10b981' : '#e5e7eb',
                      border: isCurrent ? '3px solid #fcd34d' : isDone ? '3px solid #6ee7b7' : '3px solid #e5e7eb',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(245,158,11,0.15)' : isDone ? '0 0 0 4px rgba(16,185,129,0.1)' : 'none',
                      transition: 'all 0.3s',
                      color: isPending ? '#9ca3af' : '#fff',
                      fontWeight: '700',
                    }}>
                      {isPending ? step.step : (isDone && !isCurrent ? '✓' : step.icon)}
                    </div>
                    {!isLast && (
                      <div style={{
                        width: '3px', flex: 1, minHeight: '32px',
                        background: idx < currentStepIdx ? '#10b981' : '#e5e7eb',
                        margin: '4px 0', borderRadius: '2px',
                      }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: isLast ? 0 : '16px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: isPending ? '#9ca3af' : '#111827' }}>
                      {step.label}
                    </div>

                    {isDone && displayTime && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', fontWeight: isCurrent ? '600' : '400' }}>
                        📅 {formatDateTime(displayTime)}
                      </div>
                    )}
                    {isPending && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>অপেক্ষমান</div>
                    )}

                    {/* Note display */}
                    {noteText && !isEditingThis && (
                      <div style={{
                        marginTop: '8px', background: '#f9fafb', border: '1px solid #e5e7eb',
                        borderRadius: '8px', padding: '8px 10px', fontSize: '12px', color: '#374151',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', display: 'block', marginBottom: '2px' }}>Admin নোট</span>
                        {noteText}
                        {isDone && (
                          <button onClick={() => { setEditingNote(step.value); setNoteInput(noteText); }}
                            style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Hind Siliguri, sans-serif' }}>
                            ✏️ সম্পাদনা
                          </button>
                        )}
                      </div>
                    )}

                    {/* Note editor */}
                    {isEditingThis && (
                      <div style={{ marginTop: '8px' }}>
                        <textarea
                          value={noteInput}
                          onChange={e => setNoteInput(e.target.value)}
                          placeholder="নোট লিখুন..."
                          rows={2}
                          style={{
                            width: '100%', borderRadius: '8px', border: '1.5px solid #6366f1',
                            padding: '8px', fontSize: '12px', fontFamily: 'Hind Siliguri, sans-serif',
                            resize: 'none', outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <button
                            onClick={() => saveNote(step.value)}
                            disabled={savingNote}
                            style={{
                              fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
                              background: '#1e1b4b', color: '#fff', border: 'none', cursor: 'pointer',
                              fontFamily: 'Hind Siliguri, sans-serif', opacity: savingNote ? 0.6 : 1,
                            }}>
                            {savingNote ? '⏳' : 'সংরক্ষণ'}
                          </button>
                          <button onClick={() => setEditingNote(null)} style={{
                            fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
                            background: '#e5e7eb', color: '#374151', border: 'none', cursor: 'pointer',
                            fontFamily: 'Hind Siliguri, sans-serif',
                          }}>বাতিল</button>
                        </div>
                      </div>
                    )}

                    {/* Add note button */}
                    {isDone && !noteText && !isEditingThis && (
                      <button onClick={() => { setEditingNote(step.value); setNoteInput(''); }}
                        style={{
                          marginTop: '6px', fontSize: '11px', color: '#6366f1',
                          background: 'none', border: '1px dashed #c7d2fe', borderRadius: '6px',
                          cursor: 'pointer', padding: '3px 8px', fontFamily: 'Hind Siliguri, sans-serif',
                        }}>
                        + নোট যোগ করুন
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Status Update Buttons ── */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              স্ট্যাটাস আপডেট করুন
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TIMELINE_STEPS.map(step => {
                const isCurrent = order.status === step.value;
                return (
                  <button key={step.value}
                    disabled={isCurrent || isUpdating}
                    onClick={() => onUpdateStatus(order.id, step.value, order.shop_name || order.users?.shop_name, trackingHistory)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                      border: isCurrent ? '2px solid #1e1b4b' : '2px solid #e5e7eb',
                      background: isCurrent ? '#1e1b4b' : '#fff',
                      color: isCurrent ? '#fff' : '#374151',
                      cursor: isCurrent || isUpdating ? 'default' : 'pointer',
                      opacity: isUpdating && !isCurrent ? 0.5 : 1,
                      fontFamily: 'Hind Siliguri, sans-serif', transition: 'all 0.2s',
                    }}>
                    {step.icon} {step.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Order Items ── */}
          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              পণ্য তালিকা
            </div>
            {items.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between', fontSize: '13px',
                padding: '6px 0', borderBottom: idx < items.length - 1 ? '1px solid #e5e7eb' : 'none',
              }}>
                <span style={{ color: '#374151' }}>{item.name} × {item.qty || item.quantity || 1}</span>
                <span style={{ fontWeight: '700', color: '#1e1b4b' }}>৳{Number(item.price * (item.qty || item.quantity || 1)).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', paddingTop: '10px', marginTop: '4px', borderTop: '2px solid #1e1b4b' }}>
              <span>সর্বমোট</span>
              <span style={{ color: '#1e1b4b' }}>৳{Number(order.total || 0).toLocaleString()}</span>
            </div>
          </div>

          {(phone || address) && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
              {phone && <div>📞 {phone}</div>}
              {address && <div style={{ marginTop: '2px' }}>📍 {address}</div>}
            </div>
          )}
          {order.note && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
              📝 নোট: {order.note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main OrdersTab ───────────────────────────────────────────────────────────
export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadOrders = async () => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=*,users(name,phone,shop_name)&order=created_at.desc`,
      { headers }
    );
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  };

  // ── Status update: tracking_history-তে নতুন entry push করে ──────────────────
  const updateOrderStatus = async (id, status, shopName, currentHistory = []) => {
    setUpdatingId(id);
    const now = new Date().toISOString();

    // আগের history রাখো, নতুন status entry যোগ করো (duplicate হলে replace করো)
    const existingHistory = Array.isArray(currentHistory) ? currentHistory : [];
    const filtered = existingHistory.filter(h => h.status !== status);
    const newHistory = [...filtered, { status, note: '', time: now }];

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status,
          updated_at: now,
          tracking_history: newHistory,
        }),
      });
      if (res.ok || res.status === 204) {
        const statusCfg = STATUS_OPTIONS.find(st => st.value === status);
        showToast(`✅ "${shopName || 'অর্ডার'}" → ${statusCfg?.label || status}`, 'success');
        await loadOrders();

        // Modal খোলা থাকলে আপডেট করো
        if (trackingOrder?.id === id) {
          setTrackingOrder(prev => ({ ...prev, status, updated_at: now, tracking_history: newHistory }));
        }
      } else {
        showToast('❌ আপডেট ব্যর্থ হয়েছে', 'error');
      }
    } catch {
      showToast('❌ নেটওয়ার্ক সমস্যা', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Note save: tracking_history-এর ঐ step-এর note আপডেট করো ─────────────────
  const saveTrackingNote = async (orderId, stepValue, noteText, currentHistory = []) => {
    const existingHistory = Array.isArray(currentHistory) ? currentHistory : [];

    // ঐ step-এর entry আছে কিনা চেক করো
    const hasEntry = existingHistory.some(h => h.status === stepValue);
    let newHistory;

    if (hasEntry) {
      // আছে → note আপডেট করো, time ঠিক রাখো
      newHistory = existingHistory.map(h =>
        h.status === stepValue ? { ...h, note: noteText } : h
      );
    } else {
      // নেই → নতুন entry (note আছে কিন্তু time নেই, কারণ manually নোট দিচ্ছে)
      newHistory = [...existingHistory, { status: stepValue, note: noteText, time: null }];
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ tracking_history: newHistory }),
      });
      if (res.ok || res.status === 204) {
        showToast('✅ নোট সংরক্ষিত হয়েছে', 'success');
        await loadOrders();
        // Modal আপডেট করো
        if (trackingOrder?.id === orderId) {
          setTrackingOrder(prev => ({ ...prev, tracking_history: newHistory }));
        }
      } else {
        showToast('❌ নোট সেভ ব্যর্থ হয়েছে', 'error');
      }
    } catch {
      showToast('❌ নেটওয়ার্ক সমস্যা', 'error');
    }
  };

  // ── Payment status toggle ─────────────────────────────────────────────────────
  const togglePaymentStatus = async (id, currentPaymentStatus, shopName) => {
    const newStatus = currentPaymentStatus === 'paid' ? 'due' : 'paid';
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ payment_status: newStatus }),
      });
      if (res.ok || res.status === 204) {
        showToast(`✅ "${shopName}" → Payment ${newStatus.toUpperCase()}`, 'success');
        await loadOrders();
        if (trackingOrder?.id === id) {
          setTrackingOrder(prev => ({ ...prev, payment_status: newStatus }));
        }
      } else {
        showToast('❌ আপডেট ব্যর্থ হয়েছে', 'error');
      }
    } catch {
      showToast('❌ নেটওয়ার্ক সমস্যা', 'error');
    }
  };

  const printInvoice = (o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    const date = new Date(o.created_at).toLocaleDateString('bn-BD', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const statusCfg = STATUS_OPTIONS.find(st => st.value === o.status) || STATUS_OPTIONS[0];
    const userInfo = o.users || {};
    const phone = userInfo.phone || o.phone || '';
    const buyerName = userInfo.name || o.shop_name || 'অজানা';
    const address = o.address || o.delivery_address || '';

    const isPaid = o.payment_status === 'paid';
    const html = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8"/>
        <title>Invoice #${o.id?.slice(0,8)?.toUpperCase()}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Hind Siliguri', sans-serif; color: #111; padding: 36px; max-width: 640px; margin: auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #1e1b4b; }
          .brand-name { font-size: 26px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.5px; }
          .brand-sub { font-size: 11px; font-weight: 400; color: #9ca3af; margin-top: 2px; }
          .invoice-meta { text-align: right; }
          .invoice-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
          .invoice-num { font-size: 20px; font-weight: 800; color: #1e1b4b; margin: 4px 0; }
          .invoice-date { font-size: 12px; color: #6b7280; }
          .badges { display: flex; gap: 6px; justify-content: flex-end; margin-top: 8px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
          .badge-order { background: ${statusCfg.bg}; color: ${statusCfg.color}; }
          .badge-paid { background: #d1fae5; color: #065f46; }
          .badge-due { background: #fee2e2; color: #991b1b; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
          .info-box { background: #f9fafb; border-radius: 10px; padding: 14px; border: 1px solid #f3f4f6; }
          .info-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .info-box strong { font-size: 14px; color: #111; display: block; margin-bottom: 4px; }
          .info-box p { font-size: 12px; color: #6b7280; margin-top: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          thead tr { background: #1e1b4b; }
          th { color: #fff; padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
          th:last-child, th:nth-child(2), th:nth-child(3) { text-align: right; }
          td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f3f4f6; color: #374151; }
          td:last-child, td:nth-child(2), td:nth-child(3) { text-align: right; }
          tbody tr:last-child td { border-bottom: none; }
          .total-section { border-top: 2px solid #1e1b4b; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
          .total-label { font-size: 14px; font-weight: 700; color: #1e1b4b; }
          .total-amount { font-size: 20px; font-weight: 800; color: #1e1b4b; }
          .payment-box { margin-top: 20px; padding: 14px 16px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; background: ${isPaid ? '#f0fdf4' : '#fef2f2'}; border: 1.5px solid ${isPaid ? '#6ee7b7' : '#fca5a5'}; }
          .payment-label { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .payment-status { font-size: 15px; font-weight: 800; color: ${isPaid ? '#065f46' : '#991b1b'}; }
          .footer { margin-top: 28px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-name">পাইকারি বাজার</div>
            <div class="brand-sub">B2B Wholesale Platform</div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-title">Invoice</div>
            <div class="invoice-num">#${o.id?.slice(0,8)?.toUpperCase()}</div>
            <div class="invoice-date">${date}</div>
            <div class="badges">
              <span class="badge badge-order">${statusCfg.label}</span>
              <span class="badge ${isPaid ? 'badge-paid' : 'badge-due'}">${isPaid ? '✅ PAID' : '⚠️ DUE'}</span>
            </div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Bill To</div>
            <strong>${buyerName}</strong>
            ${phone ? `<p>📞 ${phone}</p>` : ''}
            ${address ? `<p>📍 ${address}</p>` : ''}
          </div>
          <div class="info-box">
            <div class="info-label">Delivery Info</div>
            ${address ? `<strong>${address}</strong>` : '<p style="color:#9ca3af">No address provided</p>'}
            ${o.delivery_type ? `<p>🚚 ${o.delivery_type}</p>` : ''}
            ${o.delivery_date ? `<p>📅 ${o.delivery_date}</p>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Unit Price</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name || ''}</td>
                <td>৳${Number(item.price || 0).toLocaleString()}</td>
                <td>${item.qty || item.quantity || 1}</td>
                <td>৳${Number(item.price * (item.qty || item.quantity || 1)).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total-section">
          <span class="total-label">Total Amount</span>
          <span class="total-amount">৳${Number(o.total || 0).toLocaleString()}</span>
        </div>

        <div class="payment-box">
          <span class="payment-label">Payment Status</span>
          <span class="payment-status">${isPaid ? '✅ PAID' : '⚠️ PAYMENT DUE'}</span>
        </div>

        ${o.note ? `<div style="margin-top:16px;font-size:12px;color:#6b7280;font-style:italic">📝 Note: ${o.note}</div>` : ''}
        <div class="footer">পাইকারি বাজার · Thank you for your business</div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

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
          animation: 'slideIn 0.3s ease',
        }}>
          {toast.message}
        </div>
      )}

      {/* Tracking Modal */}
      {trackingOrder && (
        <TrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onUpdateStatus={updateOrderStatus}
          onSaveNote={saveTrackingNote}
          isUpdating={updatingId === trackingOrder.id}
        />
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');
      `}</style>

      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1e1b4b', fontFamily: 'Hind Siliguri, sans-serif' }}>
        অর্ডার ব্যবস্থাপনা ({orders.length})
      </h2>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterStatus('all')}
          style={{ ...s.btn, background: filterStatus === 'all' ? '#1e1b4b' : '#e5e7eb', color: filterStatus === 'all' ? '#fff' : '#374151', padding: '6px 14px', fontSize: '12px' }}>
          সব ({orders.length})
        </button>
        {STATUS_OPTIONS.map(opt => {
          const count = orders.filter(o => o.status === opt.value).length;
          return (
            <button key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              style={{ ...s.btn, background: filterStatus === opt.value ? opt.color : opt.bg, color: filterStatus === opt.value ? '#fff' : opt.color, padding: '6px 14px', fontSize: '12px' }}>
              {opt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div style={{ ...s.card, padding: '8px', background: '#f9fafb' }}>
        {filteredOrders.length === 0 && (
          <p style={{ color: '#6b7280', fontSize: '13px', fontFamily: 'Hind Siliguri, sans-serif' }}>কোনো অর্ডার নেই</p>
        )}
        {filteredOrders.map(o => {
          const items = Array.isArray(o.items) ? o.items : [];
          const date = new Date(o.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
          const statusCfg = STATUS_OPTIONS.find(st => st.value === o.status) || STATUS_OPTIONS[0];
          const isExpanded = expandedOrder === o.id;
          const userInfo = o.users || {};
          const phone = userInfo.phone || o.phone || '';
          const address = o.address || o.delivery_address || '';
          const isUpdating = updatingId === o.id;
          const currentHistory = Array.isArray(o.tracking_history) ? o.tracking_history : [];
          const isPaid = o.payment_status === 'paid';

          return (
            <div key={o.id} style={{
              border: `1.5px solid ${isPaid ? '#6ee7b7' : '#e5e7eb'}`, borderRadius: '12px', padding: '14px 16px',
              marginBottom: '12px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              fontFamily: 'Hind Siliguri, sans-serif',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#6b7280' }}>#{o.id?.slice(0, 8)?.toUpperCase()}</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: isPaid ? '#d1fae5' : '#fee2e2', color: isPaid ? '#065f46' : '#991b1b' }}>
                      {isPaid ? '✅ PAID' : '⚠️ DUE'}
                    </span>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>
                    {o.shop_name || userInfo.shop_name || 'অজানা'}
                  </div>
                  {phone && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>📞 {phone}</div>}
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {date} · {items.length} টি পণ্য · ৳{Number(o.total || 0).toLocaleString()}
                  </div>
                  {address && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>📍 {address}</div>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <select
                    value={o.status || 'pending'}
                    disabled={isUpdating}
                    onChange={e => updateOrderStatus(o.id, e.target.value, o.shop_name || userInfo.shop_name, currentHistory)}
                    style={{
                      padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
                      fontFamily: 'Hind Siliguri, sans-serif', fontSize: '13px',
                      cursor: isUpdating ? 'wait' : 'pointer', outline: 'none', opacity: isUpdating ? 0.6 : 1,
                    }}>
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => togglePaymentStatus(o.id, o.payment_status, o.shop_name || userInfo.shop_name)}
                      style={{
                        fontSize: '12px', fontWeight: '700',
                        color: isPaid ? '#065f46' : '#991b1b',
                        background: isPaid ? '#d1fae5' : '#fee2e2',
                        border: `1.5px solid ${isPaid ? '#6ee7b7' : '#fca5a5'}`,
                        cursor: 'pointer', padding: '5px 10px',
                        borderRadius: '8px', fontFamily: 'Hind Siliguri, sans-serif',
                      }}>
                      {isPaid ? '✅ PAID' : '⚠️ Mark Paid'}
                    </button>
                    <button
                      onClick={() => setTrackingOrder(o)}
                      style={{
                        fontSize: '12px', color: '#fff', background: '#f59e0b',
                        border: 'none', cursor: 'pointer', padding: '5px 10px',
                        borderRadius: '8px', fontFamily: 'Hind Siliguri, sans-serif', fontWeight: '600',
                      }}>
                      📦 ট্র্যাকিং
                    </button>

                    <button
                      onClick={() => printInvoice(o)}
                      style={{
                        fontSize: '12px', color: '#fff', background: '#1e1b4b',
                        border: 'none', cursor: 'pointer', padding: '5px 10px',
                        borderRadius: '8px', fontFamily: 'Hind Siliguri, sans-serif', fontWeight: '600',
                      }}>
                      🧾 ইনভয়েস
                    </button>

                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                      style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {isExpanded ? '▲ কম দেখুন' : '▼ বিস্তারিত'}
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '12px', background: '#eef0f5', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ marginBottom: '10px', padding: '8px', background: '#fff', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>ক্রেতার তথ্য</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>{o.shop_name || userInfo.shop_name || 'অজানা'}</div>
                    {(userInfo.name && userInfo.name !== o.shop_name) && <div style={{ fontSize: '12px', color: '#6b7280' }}>👤 {userInfo.name}</div>}
                    {phone && <div style={{ fontSize: '12px', color: '#6b7280' }}>📞 {phone}</div>}
                    {address && <div style={{ fontSize: '12px', color: '#6b7280' }}>📍 {address}</div>}
                    {o.delivery_type && <div style={{ fontSize: '12px', color: '#6b7280' }}>🚚 {o.delivery_type}</div>}
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: idx < items.length - 1 ? '1px solid #e5e7eb' : 'none', color: '#111827' }}>
                      <span style={{ fontWeight: '500' }}>{item.name} × {item.qty || item.quantity || 1}</span>
                      <span style={{ fontWeight: '700', color: '#1e1b4b' }}>৳{Number(item.price * (item.qty || item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', paddingTop: '10px', marginTop: '4px', borderTop: '2px solid #1e1b4b', color: '#111827' }}>
                    <span>মোট</span><span style={{ color: '#1e1b4b' }}>৳{Number(o.total || 0).toLocaleString()}</span>
                  </div>

                  {o.note && <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>📝 নোট: {o.note}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
