import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SupportRedirectPage() {
  const supabase = await createClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Not logged in — redirect to auth, then come back here
    redirect('/auth?redirect=/messages/support');
  }

  // Find super_admin user
  const { data: admin } = await supabase
    .from('profiles')
    .select('id')
    .or('role.eq.admin,role.eq.super_admin')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!admin) {
    // No admin found — fallback
    redirect('/messages');
  }

  redirect('/messages/' + admin.id);
}
