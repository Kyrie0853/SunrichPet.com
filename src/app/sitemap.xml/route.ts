import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sunrichpet.com';

  const [postsRes, productsRes, barsRes] = await Promise.all([
    supabase.from('community_posts').select('id,created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('products').select('slug,updated_at').eq('status', 'active').limit(100),
    supabase.from('bars').select('slug').eq('is_active', true),
  ]);

  const posts = (postsRes.data || []).map((p: any) =>
    '<url><loc>' + baseUrl + '/community/post/' + p.id + '</loc><lastmod>' + new Date(p.created_at).toISOString() + '</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>'
  ).join('');

  const products = (productsRes.data || []).map((p: any) =>
    '<url><loc>' + baseUrl + '/products/' + p.slug + '</loc><lastmod>' + new Date(p.updated_at || Date.now()).toISOString() + '</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>'
  ).join('');

  const bars = (barsRes.data || []).map((b: any) =>
    '<url><loc>' + baseUrl + '/b/' + b.slug + '</loc><changefreq>daily</changefreq><priority>0.6</priority></url>'
  ).join('');

  const staticPages = ['', 'shop', 'guide', 'encyclopedia', 'help', 'rules', 'rules/prohibited', 'rules/after-sale', 'report', 'seller/apply'].map(p =>
    '<url><loc>' + baseUrl + '/' + p + '</loc><changefreq>weekly</changefreq><priority>' + (p === '' ? '1.0' : '0.5') + '</priority></url>'
  ).join('');

  const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + staticPages + bars + posts + products + '</urlset>';

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
