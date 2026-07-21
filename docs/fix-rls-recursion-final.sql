-- ================================================
-- 终极修复: profiles RLS 无限递归 (42P17)
-- 策略: 逐条手动删除所有已知策略名 → 确认清空 → 重建
-- 执行: Supabase SQL Editor 全选执行
-- ================================================

-- Step 1: 先看现在有哪些策略
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Step 2: 逐条手动删除 (覆盖所有历史脚本的策略名)
DROP POLICY IF EXISTS "管理员可管理所有用户资料" ON public.profiles;
DROP POLICY IF EXISTS "管理员可查看所有用户" ON public.profiles;
DROP POLICY IF EXISTS "用户可读取自己的资料" ON public.profiles;
DROP POLICY IF EXISTS "用户可更新自己的资料" ON public.profiles;
DROP POLICY IF EXISTS "允许触发器创建用户资料" ON public.profiles;
DROP POLICY IF EXISTS "认证用户可读所有资料" ON public.profiles;
DROP POLICY IF EXISTS "用户可创建自己的资料" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
DROP POLICY IF EXISTS rls_profiles_select ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "p_read" ON public.profiles;
DROP POLICY IF EXISTS "p_insert" ON public.profiles;
DROP POLICY IF EXISTS "p_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Step 3: 确认清空 (应返回0)
SELECT count(*) AS remaining_policies FROM pg_policies WHERE tablename = 'profiles';

-- Step 4: 如果 Step 3 不是0, 取消注释下面代码暴力清除
/*
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', r.policyname);
    RAISE NOTICE 'Dropped: %', r.policyname;
  END LOOP;
END $$;
*/

-- Step 5: 重建零递归策略
-- SELECT: 所有认证用户可读 (profile无密码等敏感字段)
CREATE POLICY "p_read" ON public.profiles FOR SELECT TO authenticated USING (true);

-- INSERT: 只能创建自己的
CREATE POLICY "p_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- UPDATE: 只能更新自己的
CREATE POLICY "p_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Step 6: 补建你的 profile
INSERT INTO public.profiles (id, display_name, role, created_at)
VALUES ('7019c3e3-26df-4142-aec8-2a1f1eee5bc8', 'Kyrie', 'super_admin', now())
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- Step 7: 最终验证
SELECT 'Profile数据' AS check_item,
  (SELECT display_name || ' (' || COALESCE(role,'?') || ')' FROM profiles WHERE id = '7019c3e3-26df-4142-aec8-2a1f1eee5bc8') AS result
UNION ALL
SELECT 'RLS策略数',
  (SELECT count(*)::text FROM pg_policies WHERE tablename = 'profiles')
UNION ALL
SELECT '策略列表',
  (SELECT string_agg(policyname || '(' || cmd || ')', ', ') FROM pg_policies WHERE tablename = 'profiles');
