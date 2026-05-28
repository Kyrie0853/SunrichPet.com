-- 更新 handle_new_user 触发器：自动从 auth.users 的 raw_user_meta_data 中提取 display_name
-- 请在 Supabase SQL Editor 中执行此脚本

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'customer',
    NEW.raw_user_meta_data ->> 'display_name'
  );
  RETURN NEW;
END;
$$;
