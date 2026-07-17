import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sunrichpet.com';

  const [productsRes, blogRes] = await Promise.all([
    supabase.from('studio_products').select('id,updated_at').limit(100),
    supabase.from('studio_blog').select('slug,updated_at').limit(100),
  ]);

  const products = (productsRes.data || []).map((p: any) =>
    '<url><loc>' + baseUrl + '/shop/product/' + p.id + '</loc><lastmod>' + new Date(p.updated_at || Date.now()).toISOString() + '</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>'
  ).join('');

  const blogPosts = (blogRes.data || []).map((b: any) =>
    '<url><loc>' + baseUrl + '/blog/' + b.slug + '</loc><lastmod>' + new Date(b.updated_at || Date.now()).toISOString() + '</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>'
  ).join('');

  const staticPages = ['', 'shop', 'blog', 'guide', 'encyclopedia', 'help', 'rules', 'rules/after-sale'].map(p =>
    '<url><loc>' + baseUrl + '/' + p + '</loc><changefreq>weekly</changefreq><priority>' + (p === '' ? '1.0' : '0.5') + '</priority></url>'
  ).join('');

  const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + staticPages + blogPosts + products + '</urlset>';

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
