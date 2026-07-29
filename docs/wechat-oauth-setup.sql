-- ================================================
-- 微信 OAuth 登录 — 数据库兼容
-- 1. 触发器支持微信用户昵称提取
-- 2. 为已有微信用户补充 display_name
-- 请在 Supabase SQL Editor 中执行
-- ================================================

-- 1. 更新 handle_new_user() 触发器
--    支持从微信 OAuth 的 raw_user_meta_data 中提取昵称
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  -- 优先级: 1. display_name  2. name(微信)  3. full_name  4. email前缀
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), '')
  );

  INSERT INTO public.profiles (id, display_name, email, avatar_url, created_at)
  VALUES (
    NEW.id,
    v_display_name,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email            = COALESCE(NULLIF(EXCLUDED.email, ''), profiles.email),
    display_name     = COALESCE(NULLIF(EXCLUDED.display_name, ''), profiles.display_name),
    avatar_url       = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), profiles.avatar_url);
  RETURN NEW;
END;
$$;

-- 2. 为已有用户补充 display_name（处理之前无昵称的微信用户）
UPDATE public.profiles p
SET
  display_name = COALESCE(
    NULLIF(p.display_name, ''),
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    split_part(COALESCE(u.email, ''), '@', 1)
  ),
  email = COALESCE(NULLIF(p.email, ''), u.email),
  avatar_url = COALESCE(NULLIF(p.avatar_url, ''), u.raw_user_meta_data->>'avatar_url')
FROM auth.users u
WHERE p.id = u.id
  AND (
    p.display_name IS NULL OR p.display_name = ''
    OR p.email IS NULL
    OR (p.avatar_url IS NULL AND u.raw_user_meta_data->>'avatar_url' IS NOT NULL)
  );

-- 3. 验证
DO $$
DECLARE
  total INT;
  no_name INT;
BEGIN
  SELECT count(*) INTO total FROM public.profiles;
  SELECT count(*) INTO no_name FROM public.profiles WHERE display_name IS NULL OR display_name = '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'profiles 总数    : %', total;
  RAISE NOTICE '无昵称用户数     : %', no_name;
  RAISE NOTICE '微信昵称现已自动同步';
  RAISE NOTICE '========================================';
END $$;
