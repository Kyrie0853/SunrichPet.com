'use server';

import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

/**
 * 简单的 XSS 过滤 — 移除 HTML 标签和危险字符
 * 用于商品名称、描述等用户可编辑的文本
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')           // 移除 HTML 标签
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

export interface FilterResult {
  passed: boolean;
  matchedKeyword?: string;
  category?: 'contact' | 'animal' | 'illegal';
  severity?: number;
}

// 获取所有敏感关键词（缓存5分钟）
const getBlockedKeywords = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from('blocked_keywords').select('keyword,category,severity');
  return (data || []) as { keyword: string; category: string; severity: number }[];
});

// 内容过滤核心函数
export async function filterContent(text: string): Promise<FilterResult> {
  if (!text || !text.trim()) return { passed: true };

  try {
    const keywords = await getBlockedKeywords();
    const lowerText = text.toLowerCase();

    for (const kw of keywords) {
      if (lowerText.includes(kw.keyword.toLowerCase())) {
        return {
          passed: false,
          matchedKeyword: kw.keyword,
          category: kw.category as FilterResult['category'],
          severity: kw.severity,
        };
      }
    }

    return { passed: true };
  } catch (err) {
    // 关键词表不存在时放行，避免阻塞正常功能
    console.error('Content filter error:', err);
    return { passed: true };
  }
}

// 记录违规
export async function logViolation(
  userId: string,
  violationType: 'keyword_block' | 'rule_violation',
  matchedKeyword: string,
  content: string,
  actionTaken: 'warned' | 'muted' | 'banned'
) {
  const supabase = await createClient();
  await supabase.from('violation_logs').insert({
    user_id: userId,
    violation_type: violationType,
    matched_keyword: matchedKeyword,
    content: content.substring(0, 200),
    action_taken: actionTaken,
  });
}

// 获取用户处罚历史（过去90天）
export async function getUserViolationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('violation_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', ninetyDaysAgo);
  return count || 0;
}

// 检查用户是否被禁言
export async function isUserMuted(userId: string): Promise<{ muted: boolean; until?: string }> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('user_penalties')
    .select('penalty_type, ended_at')
    .eq('user_id', userId)
    .eq('penalty_type', 'mute')
    .gte('ended_at', now)
    .order('ended_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return { muted: true, until: data.ended_at };
  return { muted: false };
}

// 检查用户是否被封号
export async function isUserBanned(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', userId)
    .single();
  return data?.is_banned || false;
}

// 处罚用户（按阶梯执行）
export async function penalizeUser(
  userId: string,
  reason: string,
  adminId?: string
): Promise<{ type: string; message: string }> {
  const supabase = await createClient();
  const count = await getUserViolationCount(userId);

  // 第1次：警告
  if (count <= 1) {
    await supabase.from('user_penalties').insert({
      user_id: userId,
      penalty_type: 'warn',
      reason,
      created_by: adminId,
    });
    return { type: 'warn', message: '首次违规，已记录警告' };
  }

  // 第2次：禁言7天
  if (count <= 2) {
    const startedAt = new Date();
    const endedAt = new Date(startedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    await supabase.from('user_penalties').insert({
      user_id: userId,
      penalty_type: 'mute',
      reason,
      duration: 7,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      created_by: adminId,
    });
    return { type: 'mute', message: '禁言7天' };
  }

  // 第3次：永久封号
  await supabase.from('user_penalties').insert({
    user_id: userId,
    penalty_type: 'ban',
    reason,
    created_by: adminId,
  });
  await supabase.from('profiles').update({ is_banned: true, banned_at: new Date().toISOString(), ban_reason: reason }).eq('id', userId);
  return { type: 'ban', message: '永久封号' };
}
