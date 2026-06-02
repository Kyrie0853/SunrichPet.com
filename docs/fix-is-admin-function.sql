-- ============================================
-- 修复: is_admin() 函数包含 super_admin
-- 根因: 原函数只检查 role='admin'，
--       super_admin 用户被 RLS 阻止读取所有 profiles
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'super_admin')
  );
$$;

-- 验证
DO $$
DECLARE
  admin_count INT;
BEGIN
  SELECT count(*) INTO admin_count FROM public.profiles
  WHERE role IN ('admin', 'super_admin');
  RAISE NOTICE '管理员数量: %', admin_count;
  RAISE NOTICE '✅ is_admin() 已修复，现在包含 super_admin';
END $$;
