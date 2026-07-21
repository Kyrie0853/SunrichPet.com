-- ================================================
-- 修复: profiles 表 RLS 无限递归 (错误码 42P17)
-- 根因: 多个 SQL 脚本创建了多条递归策略
--       schema.sql → "管理员可管理所有用户资料"
--       fix-admin-users-final.sql → "管理员可查看所有用户"
--       这些策略调用 is_admin() → 查 profiles → 死循环
-- 修复: 动态删除 profiles 上所有策略, 重建无递归策略
-- 执行: Supabase SQL Editor 完整执行 (全幂等)
-- ================================================

-- Step 1: 用动态 SQL 删除 profiles 表上所有策略 (一条不留)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    RAISE NOTICE '  已删除策略: %', pol.policyname;
  END LOOP;
END $$;

-- Step 2: 确认已清空
DO $$
DECLARE
  cnt INT;
BEGIN
  SELECT count(*) INTO cnt FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles';
  IF cnt = 0 THEN
    RAISE NOTICE '✅ profiles 上所有旧策略已清除';
  ELSE
    RAISE NOTICE '⚠️  仍有 % 条策略残留，手动检查: SELECT * FROM pg_policies WHERE tablename=''profiles'';', cnt;
  END IF;
END $$;

-- Step 3: 重建干净的无递归策略
-- SELECT: 所有认证用户可读 (profile 不含密码等敏感字段)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: 用户只能创建自己的 profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: 用户只能更新自己的 profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 不创建 DELETE 策略 (仅通过 service_role API 删除)

-- Step 4: 为当前用户补建 profile 记录
INSERT INTO public.profiles (id, display_name, role, created_at)
VALUES ('7019c3e3-26df-4142-aec8-2a1f1eee5bc8', 'Kyrie', 'super_admin', now())
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- Step 5: 验证
DO $$
DECLARE
  r RECORD;
  uid UUID := '7019c3e3-26df-4142-aec8-2a1f1eee5bc8';
BEGIN
  -- 检查用户 profile
  SELECT display_name, role INTO r FROM public.profiles WHERE id = uid;
  IF r IS NULL THEN
    RAISE NOTICE '❌ 用户 profile 仍然缺失！';
  ELSE
    RAISE NOTICE '✅ profile: display_name=%, role=%', r.display_name, r.role;
  END IF;

  -- 列出当前策略
  RAISE NOTICE '---当前 profiles RLS 策略:---';
  FOR r IN (SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles') LOOP
    RAISE NOTICE '  % (%)', r.policyname, r.cmd;
  END LOOP;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 执行完毕，请刷新 /profile 页面验证';
END $$;
