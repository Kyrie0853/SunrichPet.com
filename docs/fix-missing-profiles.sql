-- ================================================
-- 修复: 用户注册后 profiles 表中缺失记录
-- 根因: handle_new_user 触发器可能未生效
-- ================================================

-- 1. 为所有缺失 profiles 的 auth.users 补充记录
INSERT INTO public.profiles (id, display_name, created_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. 确认触发器和函数存在
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. 验证
DO $$
DECLARE
  auth_count INT; profile_count INT; missing INT;
BEGIN
  SELECT count(*) INTO auth_count FROM auth.users;
  SELECT count(*) INTO profile_count FROM public.profiles;
  SELECT count(*) INTO missing FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'auth.users: %', auth_count;
  RAISE NOTICE 'public.profiles: %', profile_count;
  RAISE NOTICE '缺失 profiles: %', missing;
  RAISE NOTICE '========================================';
  IF missing > 0 THEN
    RAISE NOTICE '⚠️ 仍有 % 个用户缺少 profile，请检查触发器权限', missing;
  ELSE
    RAISE NOTICE '✅ 所有用户均有 profile 记录';
  END IF;
END $$;
