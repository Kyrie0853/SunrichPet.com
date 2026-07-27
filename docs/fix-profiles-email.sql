-- ================================================
-- 修复: profiles 表缺少多个列
-- 根因: schema.sql 只定义了 id,role,display_name,created_at
--       后续功能添加了 email,avatar_url,points,banned
--       但未写对应的 DDL 迁移
-- 请在 Supabase SQL Editor 中执行此脚本
-- ================================================

-- 1. 补全所有缺失列
DO $$
BEGIN
  -- email（从 auth.users 同步）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    RAISE NOTICE '✅ email 列已添加';
  ELSE RAISE NOTICE '📌 email 列已存在';
  END IF;

  -- avatar_url（头像）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    RAISE NOTICE '✅ avatar_url 列已添加';
  ELSE RAISE NOTICE '📌 avatar_url 列已存在';
  END IF;

  -- points（积分）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='points') THEN
    ALTER TABLE public.profiles ADD COLUMN points INTEGER DEFAULT 0;
    RAISE NOTICE '✅ points 列已添加';
  ELSE RAISE NOTICE '📌 points 列已存在';
  END IF;

  -- banned（封禁状态）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='banned') THEN
    ALTER TABLE public.profiles ADD COLUMN banned BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ banned 列已添加';
  ELSE RAISE NOTICE '📌 banned 列已存在';
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

-- 4. 验证所有列
DO $$
DECLARE
  col RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'profiles 表现有列:';
  FOR col IN
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  %  →  %', col.column_name, col.data_type;
  END LOOP;
  RAISE NOTICE '========================================';
END $$;
