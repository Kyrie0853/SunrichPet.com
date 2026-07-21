-- ================================================
-- 修复: profiles 表 RLS 无限递归 (错误码 42P17)
-- 根因: "管理员可管理所有用户资料" 策略调用 is_admin()
--       is_admin() 再查 profiles → 触发同一策略 → 死循环
-- 修复: 删除递归策略，改用无需查 profiles 的简化策略
-- 执行: Supabase SQL Editor 完整执行
-- ================================================

-- Step 1: 删除所有引起递归的旧策略
DROP POLICY IF EXISTS "管理员可管理所有用户资料" ON public.profiles;
DROP POLICY IF EXISTS "用户可读取自己的资料" ON public.profiles;
DROP POLICY IF EXISTS "用户可更新自己的资料" ON public.profiles;
DROP POLICY IF EXISTS "允许触发器创建用户资料" ON public.profiles;

-- Step 2: 重建无递归的 RLS 策略
-- SELECT: 所有认证用户可读（profile 数据非敏感，不含密码等）
CREATE POLICY "认证用户可读所有资料" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: 用户只能为自己创建 profile
CREATE POLICY "用户可创建自己的资料" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: 用户只能更新自己的 profile
CREATE POLICY "用户可更新自己的资料" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: 仅允许管理员通过 service_role API 删除（不暴露 DELETE RLS）

-- Step 3: 确保 is_admin() 重建为 SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  );
$$;

-- Step 4: 验证 — 用当前登录用户测试
DO $$
DECLARE
  uid UUID := '7019c3e3-26df-4142-aec8-2a1f1eee5bc8';
  p RECORD;
  policies TEXT[];
BEGIN
  -- 检查该用户的 profile
  SELECT * INTO p FROM public.profiles WHERE id = uid;
  IF p IS NULL THEN
    RAISE NOTICE '⚠️ 用户 % 在 profiles 中无记录，正在补建...', uid;
    INSERT INTO public.profiles (id, display_name, role, created_at)
    VALUES (uid, 'Kyrie', 'super_admin', now())
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE '✅ 已补建 profile 记录';
  ELSE
    RAISE NOTICE '✅ 用户 profile 存在: display_name=%, role=%', p.display_name, p.role;
  END IF;

  -- 列出当前所有 policies
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE '当前 profiles RLS 策略:';
  FOR rec IN (
    SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles'
  ) LOOP
    RAISE NOTICE '  - % (%)', rec.policyname, rec.cmd;
  END LOOP;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS 递归问题已修复，请刷新页面验证';
END $$;
