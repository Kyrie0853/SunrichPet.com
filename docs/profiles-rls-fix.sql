-- ============================================
-- profiles 表 RLS 修复 — 确保公开可读
-- 执行方式：Supabase SQL Editor
-- ============================================

-- 1. 启用 RLS（如果未启用）
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有旧的 profiles SELECT 策略
DROP POLICY IF EXISTS rls_profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 3. 创建新的公开读取策略（任何人都能读取 profiles）
CREATE POLICY profiles_public_read ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (true);

-- 4. 允许用户更新自己的 profile
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. 确认现有用户都有 profiles 记录
INSERT INTO public.profiles (id, display_name, created_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

DO $$ 
DECLARE
  missing INTEGER;
BEGIN
  SELECT count(*) INTO missing 
  FROM auth.users u 
  LEFT JOIN public.profiles p ON p.id = u.id 
  WHERE p.id IS NULL;
  
  RAISE NOTICE '✅ profiles RLS 修复完成';
  RAISE NOTICE '   缺失 profiles 的用户: % 人（已尝试补充）', missing;
END $$;
