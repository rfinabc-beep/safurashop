'use client';
import { useState } from 'react';
import HeroSection from './components/HeroSection';
import CategorySection from './components/CategorySection';
import BrandsSection from './components/BrandsSection';
import ProductsSection from './components/ProductsSection';
import CTABanner from './components/CTABanner';
import Footer from './components/Footer';

export default function Home() {
  const [selectedBrand, setSelectedBrand] = useState(null);

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: 'Hind Siliguri, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <HeroSection />
      <div style={{ background: '#fff' }}>
        <CategorySection />
      </div>
      <div style={{ background: '#fff' }}>
        <BrandsSection selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} />
      </div>
      <div style={{ background: '#fff' }}>
        <ProductsSection selectedBrand={selectedBrand} />
      </div>
      <CTABanner />
      <Footer />
    </main>
  );
}
