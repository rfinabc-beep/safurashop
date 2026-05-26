import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function DynamicPage({ params }) {
  const { slug } = params;

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f2442', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff', fontSize: '18px' }}>পেজ পাওয়া যায়নি।</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f2442', fontFamily: 'Hind Siliguri, sans-serif', padding: '60px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#e8a020', fontSize: '28px', fontWeight: '800', marginBottom: '24px', borderBottom: '1px solid rgba(232,160,32,0.2)', paddingBottom: '16px' }}>
          {data.title}
        </h1>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>
          {data.content}
        </div>
        <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
          সর্বশেষ আপডেট: {new Date(data.updated_at).toLocaleDateString('bn-BD')}
        </div>
      </div>
    </div>
  );
}
