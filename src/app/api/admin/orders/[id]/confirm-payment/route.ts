import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { logAdminAction } from '@/lib/auth/admin-logs';

// 管理员确认收款：pending → paid
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  if (order.status !== 'pending') return NextResponse.json({ error: '仅待支付订单可确认收款' }, { status: 400 });

  const now = new Date().toISOString();

  // 更新订单状态
  const { error } = await supabase.from('orders').update({
    status: 'paid',
    payment_method: order.payment_method || 'manual',
  }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 更新商家 pending_balance
  if (order.seller_id && order.total_amount > 0) {
    // 确保 balance 记录存在
    await supabase.from('seller_balances').upsert(
      { seller_id: order.seller_id, available_balance: 0, pending_balance: 0, total_earned: 0 },
      { onConflict: 'seller_id' }
    );
    // 增加 pending_balance（使用 RPC 或原始 SQL）
    const { data: bal } = await supabase.from('seller_balances').select('pending_balance').eq('seller_id', order.seller_id).single();
    if (bal) {
      await supabase.from('seller_balances').update({
        pending_balance: Number(bal.pending_balance) + Number(order.total_amount),
        updated_at: now,
      }).eq('seller_id', order.seller_id);
    }
  }

  // 记录日志
  await supabase.from('order_logs').insert({
    order_id: id,
    action: 'paid',
    operator_id: userId,
    details: { paymentMethod: 'manual', confirmedBy: userId, paidAt: now },
  });

  await logAdminAction({
    adminId: userId,
    action: 'confirm_payment',
    targetType: 'order',
    targetId: id,
    details: { amount: order.total_amount, sellerId: order.seller_id },
  });

  return NextResponse.json({ success: true });
}
