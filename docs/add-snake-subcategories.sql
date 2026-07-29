-- ============================================================
-- 蛇类二级分类扩充：新增王蛇、牛蛇、鼠蛇
-- 请在 Supabase SQL Editor 中执行
-- ============================================================

-- 查找蛇类顶级分类的 ID
DO $$
DECLARE
  snake_parent_id UUID;
BEGIN
  SELECT id INTO snake_parent_id FROM public.categories WHERE slug = 'snake' LIMIT 1;

  IF snake_parent_id IS NULL THEN
    RAISE NOTICE '蛇类分类(slug=snake)不存在，请先确认 categories 表数据';
    RETURN;
  END IF;

  -- 插入王蛇
  INSERT INTO public.categories (name, slug, parent_id, sort_order)
  VALUES ('王蛇', 'king-snake', snake_parent_id, 4)
  ON CONFLICT (slug) DO NOTHING;

  -- 插入牛蛇
  INSERT INTO public.categories (name, slug, parent_id, sort_order)
  VALUES ('牛蛇', 'bull-snake', snake_parent_id, 5)
  ON CONFLICT (slug) DO NOTHING;

  -- 插入鼠蛇
  INSERT INTO public.categories (name, slug, parent_id, sort_order)
  VALUES ('鼠蛇', 'rat-snake', snake_parent_id, 6)
  ON CONFLICT (slug) DO NOTHING;

  RAISE NOTICE '✅ 蛇类子分类已添加：王蛇、牛蛇、鼠蛇';
END $$;
