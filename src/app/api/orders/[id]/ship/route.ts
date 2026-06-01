import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  const { trackingNumber, trackingCompany } = await req.json();
  if (!trackingNumber) return NextResponse.json({ error: '请填写物流单号' }, { status: 400 });

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  if (order.seller_id !== user.id && order.user_id !== user.id) {
    // Admin can also ship
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }
  }
  if (order.status !== 'paid') return NextResponse.json({ error: '仅已支付订单可发货' }, { status: 400 });

  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('orders').update({
    status: 'shipped', tracking_number: trackingNumber, tracking_company: trackingCompany || '',
    shipped_at: now, inspection_deadline: deadline,
  }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('order_logs').insert({ order_id: id, action: 'shipped', operator_id: user.id, details: { trackingNumber, trackingCompany, inspectionDeadline: deadline } });
  return NextResponse.json({ success: true, inspectionDeadline: deadline });
}
