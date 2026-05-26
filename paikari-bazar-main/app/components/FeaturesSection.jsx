'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
export default function FeaturesSection() {
  const cardsRef = useRef([]);
  const router = useRouter();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );
    cardsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);
  const cards = [
    {
      icon: '🛍️',
      title: 'পণ্য দেখুন',
      desc: '',
      href: '/products',
      highlight: true,
    },
    {
      icon: '🏢',
      title: 'About Us',
      desc: 'Learn more about our platform and mission.',
      href: '/about',
    },
    {
      icon: '📄',
      title: 'Terms & Conditions',
      desc: 'Read our terms of service before using the platform.',
      href: '/terms',
    },
    {
      icon: '🔒',
      title: 'Privacy Policy',
      desc: 'Understand how we collect and protect your data.',
      href: '/privacy',
    },
  ];
  return (
    <>
      <style>{`
        .feature-card {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
          cursor: pointer;
        }
        .feature-card.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .feature-card:hover {
          border-color: #e8a020 !important;
        }
      `}</style>
      <div style={{ background: '#f8fafc', padding: '50px 20px' }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {cards.map((item, i) => (
            <div
              key={i}
              ref={(el) => (cardsRef.current[i] = el)}
              className="feature-card"
              onClick={() => router.push(item.href)}
              style={{
                background: item.highlight ? 'linear-gradient(135deg, #0f2442, #1a3a6b)' : '#ffffff',
                borderRadius: '14px',
                padding: '20px 18px',
                border: item.highlight ? '1px solid #e8a020' : '1px solid #e2e8f0',
                transitionDelay: `${i * 0.1}s`,
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '10px' }}>{item.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: item.highlight ? '#f5c842' : '#0f172a', marginBottom: '6px' }}>
                {item.title}
              </div>
              {item.desc && (
                <div style={{ fontSize: '12px', color: item.highlight ? 'rgba(255,255,255,0.6)' : '#64748b', lineHeight: '1.6' }}>
                  {item.desc}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
