'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('সব তথ্য পূরণ করুন');
      return;
    }
    if (form.username !== 'admin' || form.password !== 'admin123') {
      setError('ভুল username বা password');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/admin/dashboard');
    }, 1000);
  };

  const inp = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #3d3a6b',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
    marginBottom: '16px',
    background: '#2d2a5e',
    color: '#fff',
  };

  return (
    <main style={{ minHeight: '100vh', background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#2d2a5e', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        <h1 style={{ color: '#e8a020', fontSize: '24px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>Admin Panel</h1>
        <p style={{ color: '#aaa', fontSize: '14px', textAlign: 'center', marginBottom: '28px' }}>পাইকারি বাজার পরিচালনা</p>

        {error && (
          <div style={{ background: '#4a1a1a', color: '#ff8080', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', color: '#e8a020', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Username</label>
          <input name="username" value={form.username} onChange={handleChange} placeholder="admin" style={inp} />
          <label style={{ display: 'block', color: '#e8a020', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="পাসওয়ার্ড দিন" style={{ ...inp, marginBottom: '24px' }} />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#555' : '#e8a020', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'অপেক্ষা করুন...' : 'লগইন করুন'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#888' }}>
          <a href="/" style={{ color: '#e8a020', textDecoration: 'none' }}>← মূল পেজে ফিরুন</a>
        </p>
      </div>
    </main>
  );
}
