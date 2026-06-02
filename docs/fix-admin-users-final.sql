-- ================================================
-- 最终修复: 管理后台用户列表为空
-- 根因: is_admin() 不识别 super_admin
--       profiles RLS 阻止 super_admin 读取所有用户
-- ================================================

-- 1. 修复 is_admin() 函数
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'super_admin')
  );
$$;

-- 2. 确认 profiles RLS 已启用
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 确保管理员 SELECT 策略存在（使用内联检查，不依赖 is_admin）
DROP POLICY IF EXISTS "管理员可查看所有用户" ON public.profiles;
CREATE POLICY "管理员可查看所有用户" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR p.role = 'super_admin')
    )
    OR auth.uid() = id
  );

-- 4. 验证
DO $$
DECLARE
  total INT; admin_count INT;
BEGIN
  SELECT count(*) INTO total FROM public.profiles;
  SELECT count(*) INTO admin_count FROM public.profiles
  WHERE role IN ('admin', 'super_admin');
  RAISE NOTICE '========================================';
  RAISE NOTICE 'profiles 总数: %', total;
  RAISE NOTICE '管理员账号: %', admin_count;
  RAISE NOTICE 'is_admin() 现在识别 admin + super_admin';
  RAISE NOTICE '管理员可读取所有用户资料';
  RAISE NOTICE '========================================';
END $$;
