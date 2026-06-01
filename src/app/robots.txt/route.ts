export async function GET() {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Sitemap: ' + (process.env.NEXT_PUBLIC_SITE_URL || 'https://sunrichpet.com') + '/sitemap.xml',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain' } });
}