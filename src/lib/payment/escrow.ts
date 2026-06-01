'use server';

import { createClient } from '@/lib/supabase/server';

// ---- 订单操作日志 ----
export async function logOrderAction(orderId: string, action: string, operatorId?: string, details?: Record<string, any>) {
  const supabase = await createClient();
  await supabase.from('order_logs').insert({ order_id: orderId, action, operator_id: operatorId, details: details || {} });
}

// ---- 获取商家余额 ----
export async function getSellerBalance(sellerId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('seller_balances').select('*').eq('seller_id', sellerId).maybeSingle();
  return data || { seller_id: sellerId, available_balance: 0, pending_balance: 0, total_earned: 0 };
}

// ---- 商家发货 ----
export async function shipOrder(orderId: string, sellerId: string, trackingNumber: string, trackingCompany: string) {
  const supabase = await createClient();
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order) return { success: false, error: '订单不存在' };
  if (order.status !== 'paid') return { success: false, error: '订单状态不正确，仅已支付订单可发货' };
  if (order.seller_id !== sellerId) return { success: false, error: '无权操作此订单' };

  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48小时验货期

  const { error } = await supabase.from('orders').update({
    status: 'shipped',
    tracking_number: trackingNumber,
    tracking_company: trackingCompany,
    shipped_at: now,
    inspection_deadline: deadline,
  }).eq('id', orderId);

  if (error) return { success: false, error: error.message };
  await logOrderAction(orderId, 'shipped', sellerId, { trackingNumber, trackingCompany, inspectionDeadline: deadline });
  return { success: true, inspectionDeadline: deadline };
}

// ---- 买家确认收货 ----
export async function confirmOrder(orderId: string, userId: string) {
  const supabase = await createClient();
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order) return { success: false, error: '订单不存在' };
  if (order.user_id !== userId) return { success: false, error: '无权操作此订单' };
  if (order.status !== 'shipped') return { success: false, error: '订单状态不正确，仅已发货订单可确认收货' };

  const now = new Date().toISOString();

  // 更新订单状态
  const { error } = await supabase.from('orders').update({
    status: 'completed',
    confirmed_at: now,
  }).eq('id', orderId);

  if (error) return { success: false, error: error.message };

  // 结算：将金额从 pending 转入 available
  if (order.seller_id) {
    await supabase.rpc('settle_order_balance', { p_order_id: orderId, p_amount: order.total_amount });
  }

  await logOrderAction(orderId, 'completed', userId);
  return { success: true };
}

// ---- 买家申请退款 ----
export async function requestRefund(orderId: string, userId: string, reason: string, refundAmount: number, evidenceUrls: string[]) {
  const supabase = await createClient();
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order) return { success: false, error: '订单不存在' };
  if (order.user_id !== userId) return { success: false, error: '无权操作此订单' };
  if (order.status !== 'shipped') return { success: false, error: '仅已发货订单可申请退款' };

  // 检查验货期
  if (order.inspection_deadline && new Date(order.inspection_deadline) < new Date()) {
    return { success: false, error: '验货期已过，无法申请退款。如有问题请联系平台客服。' };
  }

  // 创建退款申请
  const { data: refund, error } = await supabase.from('refund_requests').insert({
    order_id: orderId,
    user_id: userId,
    reason,
    refund_amount: refundAmount || order.total_amount,
    evidence_urls: evidenceUrls,
    status: 'pending',
  }).select('id').single();

  if (error) return { success: false, error: error.message };

  // 更新订单状态
  await supabase.from('orders').update({ status: 'refunding' }).eq('id', orderId);
  await logOrderAction(orderId, 'refund_requested', userId, { reason, refundAmount, refundId: refund.id });
  return { success: true, refundId: refund.id };
}

// ---- 管理员处理退款 ----
export async function processRefund(refundId: string, adminId: string, approved: boolean, adminNote?: string) {
  const supabase = await createClient();
  const { data: refund } = await supabase.from('refund_requests').select('*').eq('id', refundId).single();
  if (!refund) return { success: false, error: '退款申请不存在' };
  if (refund.status !== 'pending') return { success: false, error: '该申请已处理' };

  const orderId = refund.order_id;
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();

  const now = new Date().toISOString();

  if (approved) {
    // 同意退款
    await supabase.from('refund_requests').update({ status: 'approved', admin_note: adminNote, updated_at: now }).eq('id', refundId);
    await supabase.from('orders').update({ status: 'refunded', refunded_at: now }).eq('id', orderId);

    // 退回 pending_balance
    if (order?.seller_id && order?.status === 'shipped') {
      await supabase.rpc('reverse_order_balance', { p_order_id: orderId, p_amount: order.total_amount });
    }

    await logOrderAction(orderId, 'refund_approved', adminId, { refundId, adminNote });
    return { success: true, action: 'approved' };
  } else {
    // 拒绝退款 → 恢复为已发货状态
    await supabase.from('refund_requests').update({ status: 'rejected', admin_note: adminNote, updated_at: now }).eq('id', refundId);
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);
    await logOrderAction(orderId, 'refund_rejected', adminId, { refundId, adminNote });
    return { success: true, action: 'rejected' };
  }
}
