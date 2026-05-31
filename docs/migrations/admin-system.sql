-- ============================================
-- 超级管理员系统 — 数据库迁移
-- 执行方式：Supabase SQL Editor
-- ============================================

-- 1. 确认 profiles.role 字段存在并设置默认值
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'customer';
  END IF;
END $$;

-- 添加 role 约束
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('customer', 'admin', 'super_admin'));

-- 2. 创建 admin_logs 表
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_logs_admin_idx ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS admin_logs_created_idx ON public.admin_logs(created_at DESC);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS: admin 和 super_admin 可读取所有日志
DROP POLICY IF EXISTS rls_admin_logs_select ON public.admin_logs;
CREATE POLICY rls_admin_logs_select ON public.admin_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- RLS: admin 和 super_admin 可写入日志
DROP POLICY IF EXISTS rls_admin_logs_insert ON public.admin_logs;
CREATE POLICY rls_admin_logs_insert ON public.admin_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- 3. 补充 profiles RLS：仅 super_admin 可修改他人 role
DROP POLICY IF EXISTS profiles_super_admin_update ON public.profiles;
CREATE POLICY profiles_super_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- 4. 初始化：提示设置 super_admin
DO $$ 
DECLARE
  current_super INTEGER;
BEGIN
  SELECT count(*) INTO current_super FROM public.profiles WHERE role = 'super_admin';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 超级管理员系统数据库迁移完成';
  RAISE NOTICE '   admin_logs 表已创建';
  RAISE NOTICE '   RLS 策略已配置';
  RAISE NOTICE '   当前 super_admin 数量: %', current_super;
  RAISE NOTICE '';
  RAISE NOTICE '📌 请手动执行以下 SQL 设置你的主账号为 super_admin:';
  RAISE NOTICE '   UPDATE public.profiles SET role = ''super_admin'' WHERE id = ''<你的user_id>'';';
  RAISE NOTICE '========================================';
END $$;
