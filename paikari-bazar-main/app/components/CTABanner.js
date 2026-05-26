'use client';
import { useRouter } from 'next/navigation';

export default function CTABanner() {
  const router = useRouter();
  return (
    <div style={{ margin: '0 20px 16px', background: '#1a2e44', borderRadius: '10px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <div style={{ color: '#fff', fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
          আজই সাপ্লায়ার হিসেবে নিবন্ধন করুন
        </div>
        <div style={{ color: '#aac4e0', fontSize: '12px' }}>
          বিনামূল্যে · কোনো কমিশন নেই · যেকোনো সময় বাতিল
        </div>
      </div>
      <button
        onClick={() => router.push('/register')}
        style={{ background: '#ff6a00', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        এখনই শুরু করুন →
      </button>
    </div>
  );
}
