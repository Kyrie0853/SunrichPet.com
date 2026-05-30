-- ============================================
-- 个人中心 & 通知系统 数据库扩展
-- 请在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 扩展 profiles：隐私设置字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_favorites BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_likes BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_follows BOOLEAN NOT NULL DEFAULT true;

-- 2. 通知表
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'comment', 'reply', 'follow', 'like'
  )),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notif_user_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notif_unread_idx ON public.notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS: 用户只能读自己的通知
CREATE POLICY rls_notif_read ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- RLS: 系统触发器可插入（SECURITY DEFINER）
CREATE POLICY rls_notif_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- RLS: 用户可标记自己的通知已读
CREATE POLICY rls_notif_update ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);