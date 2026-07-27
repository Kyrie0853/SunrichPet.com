-- ================================================
-- 修复: profiles 表缺少 email 列
-- 根因: schema.sql 未定义 email 列
--       但 API 代码查询了 profiles.email
-- 请在 Supabase SQL Editor 中执行此脚本
-- ================================================

-- 1. 添加 email 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    RAISE NOTICE '✅ email 列已添加';
  ELSE
    RAISE NOTICE '📌 email 列已存在，跳过添加';
  END IF;
END $$;

-- 2. 更新 handle_new_user() 触发器：自动写入 email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(NULLIF(profiles.display_name, ''), EXCLUDED.display_name);
  RETURN NEW;
END;
$$;

-- 3. 为现有用户回填 email（从 auth.users）
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 4. 验证
DO $$
DECLARE
  total INT; null_email INT;
BEGIN
  SELECT count(*) INTO total FROM public.profiles;
  SELECT count(*) INTO null_email FROM public.profiles WHERE email IS NULL;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'profiles 总数   : %', total;
  RAISE NOTICE 'email 为空的行  : %', null_email;
  RAISE NOTICE '========================================';
END $$;
