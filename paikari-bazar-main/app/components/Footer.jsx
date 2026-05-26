'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function Footer() {
  const router = useRouter();
  const [extraLinks, setExtraLinks] = useState([]);
  const [activeCard, setActiveCard] = useState(0);
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/pages?order=id.asc&select=slug,title`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setExtraLinks(data.map(p => ({ title: p.title, href: `/${p.slug}` })));
        }
      } catch (e) {}
    };
    fetchPages();
  }, []);

  const cols = [
    {
      title: 'আড়ৎ সম্পর্কে',
      links: [
        { title: 'আমাদের পরিচয়', href: '/about' },
        { title: 'কীভাবে কাজ করে', href: '/about' },
        { title: 'যোগাযোগ', href: '/contact' },
      ],
    },
    {
      title: 'ক্রেতাদের জন্য',
      links: [
        { title: 'নিবন্ধন করুন', href: '/register' },
        { title: 'পণ্য দেখুন', href: '/products' },
        { title: 'অর্ডার ট্র্যাক', href: '/orders' },
      ],
    },
    {
      title: 'সাপ্লায়ারদের জন্য',
      links: [
        { title: 'সাপ্লায়ার হোন', href: '/register' },
        { title: 'পণ্য লিস্ট করুন', href: '/dashboard' },
      ],
    },
    {
      title: 'সাহায্য',
      links: [
        { title: 'Terms & Conditions', href: '/terms' },
        { title: 'Privacy Policy', href: '/privacy' },
        ...extraLinks,
      ],
    },
  ];

  const handleSliderScroll = () => {
    const slider = sliderRef.current;
    if (!slider) return;
    const cards = slider.querySelectorAll('.ft-card');
    let closest = 0, minDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.getBoundingClientRect().left - slider.getBoundingClientRect().left);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setActiveCard(closest);
  };

  return (
    <>
      <style>{`
        .ft-link { font-size: 12px; color: rgba(255,255,255,0.5); cursor: pointer; display: block; margin-bottom: 6px; transition: color 0.2s; }
        .ft-link:hover { color: #ff6a00; }

        /* Desktop */
        .ft-desktop-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 24px; margin-bottom: 20px; }
        .ft-mobile-section { display: none; }

        /* Mobile */
        @media (max-width: 640px) {
          .ft-desktop-cols { display: none; }
          .ft-mobile-section { display: block; }
          .ft-slider { overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; display: flex; gap: 10px; padding: 0 16px 10px; scrollbar-width: none; }
          .ft-slider::-webkit-scrollbar { display: none; }
          .ft-card { flex: 0 0 150px; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,106,0,0.2); border-radius: 8px; padding: 12px 14px; scroll-snap-align: start; }
          .ft-card-title { font-size: 10px; font-weight: 700; color: #ff6a00; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.4px; }
          .ft-card-link { font-size: 11px; color: rgba(255,255,255,0.45); display: block; margin-bottom: 5px; cursor: pointer; }
          .ft-dots { display: flex; justify-content: center; gap: 5px; margin: 4px 0 12px; }
          .ft-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.2); transition: background 0.2s; }
          .ft-dot.active { background: #ff6a00; }
        }
      `}</style>

      <footer style={{ background: '#111', borderTop: '1px solid rgba(255,106,0,0.2)', padding: '28px 20px 16px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Desktop columns */}
          <div className="ft-desktop-cols">
            {cols.map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>{col.title}</div>
                {col.links.map((l, j) => (
                  <span key={j} className="ft-link" onClick={() => router.push(l.href)}>{l.title}</span>
                ))}
              </div>
            ))}
          </div>

          {/* Mobile card slider */}
          <div className="ft-mobile-section">
            <div className="ft-slider" ref={sliderRef} onScroll={handleSliderScroll}>
              {cols.map((col, i) => (
                <div key={i} className="ft-card">
                  <div className="ft-card-title">{col.title}</div>
                  {col.links.map((l, j) => (
                    <span key={j} className="ft-card-link" onClick={() => router.push(l.href)}>{l.title}</span>
                  ))}
                </div>
              ))}
            </div>
            <div className="ft-dots">
              {cols.map((_, i) => (
                <div key={i} className={`ft-dot${activeCard === i ? ' active' : ''}`} />
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <Image src="/logo.png" alt="আড়ৎ" width={70} height={28} style={{ objectFit: 'contain', mixBlendMode: 'screen' }} />
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
              © {new Date().getFullYear()} <span style={{ color: 'rgba(255,106,0,0.6)' }}>আড়ৎ</span> — সর্বস্বত্ব সংরক্ষিত
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>bKash · নগদ · ব্যাংক ট্রান্সফার</div>
          </div>

        </div>
      </footer>
    </>
  );
}
