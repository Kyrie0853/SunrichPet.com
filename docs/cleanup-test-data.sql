-- ============================================================
-- 清理测试数据
-- 保留你的主账号和手动创建的真实内容
-- 执行前请先确认你的主账号 email
-- ============================================================

-- 请替换 'your-admin@email.com' 为你的管理员邮箱
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- 获取管理员账号ID（请替换邮箱地址）
  SELECT id INTO admin_id FROM auth.users WHERE email = 'your-admin@email.com' LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE '⚠️ 未找到管理员账号，请先替换 your-admin@email.com';
    RETURN;
  END IF;

  -- 删除测试商品（保留管理员创建的商品）
  DELETE FROM public.products WHERE seller_id != admin_id;

  -- 删除测试帖子（保留管理员的帖子）
  DELETE FROM public.community_posts WHERE author_id != admin_id;

  -- 删除测试用户（保留管理员）
  DELETE FROM public.profiles WHERE id != admin_id;

  RAISE NOTICE '✅ 测试数据清理完成，管理员ID: %', admin_id;
END $$;
