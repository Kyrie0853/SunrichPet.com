-- ============================================
-- 社区治理体系：区主 + 区管理员 (2026-06-02)
-- ============================================

-- 1. bars 表添加 owner_id
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. bar_admins 表
CREATE TABLE IF NOT EXISTS public.bar_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bar_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_bar_admins_bar ON public.bar_admins(bar_id);
CREATE INDEX IF NOT EXISTS idx_bar_admins_user ON public.bar_admins(user_id);

-- 3. RLS
ALTER TABLE public.bar_admins ENABLE ROW LEVEL SECURITY;

-- 任何人可读
DROP POLICY IF EXISTS rls_bar_admins_select ON public.bar_admins;
CREATE POLICY rls_bar_admins_select ON public.bar_admins FOR SELECT TO anon, authenticated USING (true);

-- 区主或超管可任命/撤销管理员
DROP POLICY IF EXISTS rls_bar_admins_insert ON public.bar_admins;
CREATE POLICY rls_bar_admins_insert ON public.bar_admins FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bars WHERE bars.id = bar_admins.bar_id AND bars.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
  )
);

DROP POLICY IF EXISTS rls_bar_admins_delete ON public.bar_admins;
CREATE POLICY rls_bar_admins_delete ON public.bar_admins FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bars WHERE bars.id = bar_admins.bar_id AND bars.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
  )
);

-- 4. 辅助函数：检查用户在社区中的角色
CREATE OR REPLACE FUNCTION public.get_bar_role(p_user_id UUID, p_bar_slug TEXT)
RETURNS TEXT LANGUAGE plpgsql STABLE SET search_path = ''
AS $$
DECLARE
  bar_id UUID;
BEGIN
  SELECT id INTO bar_id FROM public.bars WHERE slug = p_bar_slug;
  IF bar_id IS NULL THEN RETURN NULL; END IF;
  -- 区主
  IF EXISTS (SELECT 1 FROM public.bars WHERE id = bar_id AND owner_id = p_user_id) THEN
    RETURN 'owner';
  END IF;
  -- 区管理员
  IF EXISTS (SELECT 1 FROM public.bar_admins WHERE bar_id = bar_id AND user_id = p_user_id) THEN
    RETURN 'bar_admin';
  END IF;
  RETURN NULL;
END;
$$;

DO $$ BEGIN RAISE NOTICE 'Bar governance tables created'; END $$;
