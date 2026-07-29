-- ============================================================
-- 蛇类二级分类扩充：新增王蛇、牛蛇、鼠蛇
-- 请在 Supabase SQL Editor 中执行
-- ============================================================
-- 说明：product_categories 表用于商城商品分类管理。
--       表结构: id(uuid PK), name, slug(UNIQUE), parent_id, created_at
--       无 sort_order 字段，按 name 字母序排列即可。
-- ============================================================

-- 查找蛇类顶级分类的 ID
DO $$
DECLARE
  snake_parent_id UUID;
BEGIN
  SELECT id INTO snake_parent_id FROM product_categories WHERE slug = 'snake' LIMIT 1;

  IF snake_parent_id IS NULL THEN
    RAISE NOTICE '❌ 蛇类顶级分类(slug=snake)不存在于 product_categories 表，请先确认数据';
    RETURN;
  END IF;

  -- 插入王蛇
  INSERT INTO product_categories (name, slug, parent_id)
  VALUES ('王蛇', 'king-snake', snake_parent_id)
  ON CONFLICT (slug) DO NOTHING;

  -- 插入牛蛇
  INSERT INTO product_categories (name, slug, parent_id)
  VALUES ('牛蛇', 'bull-snake', snake_parent_id)
  ON CONFLICT (slug) DO NOTHING;

  -- 插入鼠蛇
  INSERT INTO product_categories (name, slug, parent_id)
  VALUES ('鼠蛇', 'rat-snake', snake_parent_id)
  ON CONFLICT (slug) DO NOTHING;

  RAISE NOTICE '✅ 蛇类子分类已添加：王蛇、牛蛇、鼠蛇';
END $$;

-- 验证当前蛇类的所有子分类
SELECT p.name AS "顶级分类", c.name AS "子分类名称", c.slug AS "slug"
FROM product_categories c
JOIN product_categories p ON p.id = c.parent_id
WHERE p.slug = 'snake'
ORDER BY c.name;
