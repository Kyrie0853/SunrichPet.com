-- ================================================
-- 修复: 用户个人信息页面空白问题
-- 根因分析:
--   1. profiles 表缺少 bio / avatar_url / updated_at 列
--   2. 部分用户可能因触发器失效导致 profiles 记录缺失
--   3. 缺少用户自行 INSERT 的 RLS 策略（用户无法自行补建 profile）
-- 执行方式: 在 Supabase SQL Editor 中完整执行
-- 所有操作均为幂等 (可重复执行不报错)
-- ================================================

-- Step 1: 确保 profiles 表拥有所有必需列
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Step 2: 重建触发器函数 — 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'customer',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Step 3: 重建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: 为所有缺失 profiles 的 auth.users 补充记录
INSERT INTO public.profiles (id, display_name, role, created_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  'customer',
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 5: 确保 role 列存在并有正确默认值
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

-- Step 6: 确保 profiles 表 RLS 已启用
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: 为超级管理员手动设置 role（请替换邮箱为你的真实邮箱）
-- ⚠️ 执行前将 'your-admin@email.com' 替换为你的管理员邮箱
/*
UPDATE public.profiles
SET role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-admin@email.com'
);
*/

-- Step 8: 补充 RLS 策略 — 允许用户自行创建/补建 profile
DROP POLICY IF EXISTS "允许触发器创建用户资料" ON public.profiles;
CREATE POLICY "允许触发器创建用户资料" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Step 9: 修复 RLS 策略 — 确保用户能读写自己的 profile
DROP POLICY IF EXISTS "用户可读取自己的资料" ON public.profiles;
CREATE POLICY "用户可读取自己的资料" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "用户可更新自己的资料" ON public.profiles;
CREATE POLICY "用户可更新自己的资料" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 10: 确保 is_admin() 函数存在（RLS 依赖）
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

-- ============================================
-- 验证: 输出当前状态
-- ============================================
DO $$
DECLARE
  auth_count INT;
  profile_count INT;
  missing INT;
  has_bio BOOLEAN;
  has_avatar BOOLEAN;
  has_updated_at BOOLEAN;
  rec RECORD;
BEGIN
  SELECT count(*) INTO auth_count FROM auth.users;
  SELECT count(*) INTO profile_count FROM public.profiles;
  SELECT count(*) INTO missing FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) INTO has_bio;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) INTO has_avatar;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) INTO has_updated_at;

  RAISE NOTICE '========================================';
  RAISE NOTICE '     profiles 表健康检查报告';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'auth.users 总数:       %', auth_count;
  RAISE NOTICE 'public.profiles 总数:  %', profile_count;
  RAISE NOTICE '缺失 profiles 的用户:  %', missing;
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'bio 列:               %', CASE WHEN has_bio THEN '✅' ELSE '❌ 缺失' END;
  RAISE NOTICE 'avatar_url 列:        %', CASE WHEN has_avatar THEN '✅' ELSE '❌ 缺失' END;
  RAISE NOTICE 'updated_at 列:        %', CASE WHEN has_updated_at THEN '✅' ELSE '❌ 缺失' END;
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE '🔑 超级管理员列表:';
  FOR rec IN (SELECT u.email, p.role FROM auth.users u JOIN public.profiles p ON p.id = u.id WHERE p.role = 'super_admin') LOOP
    RAISE NOTICE '   % (role: %)', rec.email, rec.role;
  END LOOP;
  RAISE NOTICE '========================================';

  IF missing > 0 THEN
    RAISE NOTICE '⚠️  仍有 % 个用户缺少 profile，请检查触发器权限', missing;
  ELSE
    RAISE NOTICE '✅ 所有用户均有 profile 记录';
  END IF;
END $$;
