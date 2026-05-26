'use client';


export default function HeroWholesale() {
  return (
    <section style={{
      width: '100%',
      background: 'linear-gradient(135deg, #1e3a5f, #1a5276, #1a6ea8)',
      color: '#fff',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '40px',
        alignItems: 'center'
      }}>

        {/* LEFT SIDE */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <p style={{
            display: 'inline-block',
            background: 'rgba(232,160,32,0.2)',
            color: '#e8a020',
            padding: '4px 16px',
            borderRadius: '999px',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            রেজিস্টর্ড দোকানদারদের জন্য
          </p>

          <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.2', margin: '0 0 16px' }}>
            বাজারে না গিয়েও <br />
            <span style={{ color: '#e8a020' }}>পাইকরি মাল নিন</span>
          </h1>

          <p style={{ fontSize: '18px', color: '#bcd6f0', lineHeight: '1.7', maxWidth: '500px' }}>
            আপনার দোকানের পয়োজনীয় পণ্য এখন মোবাইলই অর্ডার করুন।
            দ্রুত সরবরাহ, সহজ অর্ডার, নিররযোগ্য সেবা।
          </p>

          <div style={{ marginTop: '28px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button style={{
              background: '#e8a020',
              color: '#fff',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '700',
              cursor: 'pointer'
            }}>
              আজই অর্ডার করুন
            </button>
            <button style={{
              background: 'transparent',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.4)',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              দাম দেখুন
            </button>
          </div>

          <div style={{ marginTop: '24px', color: '#bcd6f0', fontSize: '15px', lineHeight: '2' }}>
            <p>✔ দ্রুত সরবরাহ</p>
            <p>✔ সহজ পুনরায় অর্ডার</p>
            <p>✔ নির্ভরযোগ্য পাইকারি সেবা</p>
          </div>
        </div>

        {/* RIGHT SIDE - CSS Animation */}
        <div style={{ flex: '1', minWidth: '300px', position: 'relative', height: '420px' }}>

          {/* Shop */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '24px',
            width: '192px',
            height: '176px',
            background: '#fef9c3',
            borderRadius: '12px 12px 0 0',
            border: '4px solid #fde68a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'fadeUp 1s ease forwards'
          }}>
            <div style={{
              background: '#ef4444',
              color: '#fff',
              textAlign: 'center',
              padding: '8px',
              fontWeight: '700',
              fontSize: '13px',
              borderRadius: '8px 8px 0 0'
            }}>আপনার দোকান</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '12px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: '48px', background: '#fff', borderRadius: '6px' }}></div>
              ))}
            </div>
          </div>

          {/* Worried owner */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '224px',
            fontSize: '48px',
            animation: 'bounce 1.6s ease-in-out infinite'
          }}>😟</div>

          {/* Mobile */}
          <div style={{
            position: 'absolute',
            top: '32px',
            left: '96px',
            width: '112px',
            height: '192px',
            background: '#fff',
            borderRadius: '24px',
            border: '4px solid #d1d5db',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            padding: '12px',
            color: '#000',
            animation: 'pulse 4s ease infinite'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textAlign: 'center', marginBottom: '8px' }}>অর্ডার</div>
            {['সিগারেট', 'বিস্কুট', 'নুডলস', 'পানীয়'].map((item, i) => (
              <div key={i} style={{ background: '#f3f4f6', borderRadius: '4px', padding: '4px 6px', fontSize: '10px', marginBottom: '6px' }}>{item}</div>
            ))}
            <div style={{ background: '#22c55e', color: '#fff', textAlign: 'center', fontSize: '10px', padding: '4px', borderRadius: '4px', marginTop: '8px' }}>
              অর্ডার সম্পন্ন
            </div>
          </div>

          {/* Truck */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '0',
            display: 'flex',
            alignItems: 'flex-end',
            animation: 'drive 8s linear infinite'
          }}>
            <div style={{ width: '112px', height: '64px', background: '#e5e7eb', borderRadius: '8px 8px 0 0', border: '2px solid #d1d5db', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: '24px', height: '24px', background: '#000', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', bottom: '-12px', left: '72px', width: '24px', height: '24px', background: '#000', borderRadius: '50%' }}></div>
            </div>
            <div style={{ width: '64px', height: '48px', background: '#e8a020', borderRadius: '8px 8px 0 0', border: '2px solid #d97706', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: '24px', height: '24px', background: '#000', borderRadius: '50%' }}></div>
            </div>
          </div>

          {/* Dashed route */}
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '192px',
            right: '40px',
            borderTop: '3px dashed rgba(255,255,255,0.3)'
          }}></div>

          {/* Floating text */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0,0,0,0.4)',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            animation: 'textCycle 8s infinite'
          }}>
            মাল শেষ হয়ে গেছে?
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.97); }
        }
        @keyframes drive {
          0% { transform: translateX(-250px); }
          100% { transform: translateX(500px); }
        }
        @keyframes textCycle {
          0%, 30% { opacity: 1; }
          40%, 100% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
