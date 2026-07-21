-- ================================================
-- 移除"球蟒"分类 — 数据库操作脚本
-- 执行方式: Supabase SQL Editor 中完整执行
-- 包含: 删除分类 + 处理关联产品 + 回滚方案
-- ================================================

-- Step 1: 查询球蟒分类是否存在
DO $$
DECLARE
  ball_python_id UUID;
  affected_products INT;
BEGIN
  SELECT id INTO ball_python_id FROM product_categories WHERE slug = 'ball-python';

  IF ball_python_id IS NULL THEN
    RAISE NOTICE '✅ 球蟒分类不存在，无需删除';
    RETURN;
  END IF;

  RAISE NOTICE '📌 找到球蟒分类 ID: %', ball_python_id;

  -- 查询受影响的产品数量
  SELECT count(*) INTO affected_products FROM studio_products WHERE category_id = ball_python_id;
  RAISE NOTICE '📌 关联产品数: %', affected_products;
END $$;

-- Step 2: 将关联产品的 category_id 置为 NULL（避免外键错误）
-- 如果想让产品归入"玉米蛇"，取消下面的注释并执行:
-- UPDATE studio_products
-- SET category_id = (SELECT id FROM product_categories WHERE slug = 'corn-snake')
-- WHERE category_id = (SELECT id FROM product_categories WHERE slug = 'ball-python');

-- 默认：设为 NULL
UPDATE studio_products
SET category_id = NULL
WHERE category_id = (SELECT id FROM product_categories WHERE slug = 'ball-python');

-- Step 3: 删除球蟒分类
DELETE FROM product_categories WHERE slug = 'ball-python';

-- Step 4: 验证
DO $$
DECLARE
  remaining INT;
  orphaned INT;
BEGIN
  SELECT count(*) INTO remaining FROM product_categories WHERE slug = 'ball-python';
  SELECT count(*) INTO orphaned FROM studio_products
    WHERE category_id IS NOT NULL
      AND category_id NOT IN (SELECT id FROM product_categories);

  RAISE NOTICE '========================================';
  RAISE NOTICE '  移除球蟒分类 - 执行结果';
  RAISE NOTICE '========================================';
  RAISE NOTICE '球蟒分类残留:  % (应为 0)', remaining;
  RAISE NOTICE '孤儿产品(category_id 无效): %', orphaned;
  RAISE NOTICE '========================================';
  IF remaining = 0 THEN
    RAISE NOTICE '✅ 球蟒分类已成功删除';
  END IF;
END $$;

-- ================================================
-- 回滚方案（如需恢复，执行以下语句）
-- ================================================
/*
-- 重新插入球蟒分类
WITH top AS (SELECT id FROM product_categories WHERE slug = 'snake')
INSERT INTO product_categories (name, slug, parent_id)
SELECT '球蟒', 'ball-python', top.id
FROM top
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE slug = 'ball-python');

-- 恢复产品关联（需要手动指定哪些产品原本属于球蟒分类）
-- UPDATE studio_products SET category_id = (SELECT id FROM product_categories WHERE slug = 'ball-python')
-- WHERE id IN (/* 填入产品 ID */);
*/
