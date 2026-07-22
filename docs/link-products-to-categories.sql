-- ============================================
-- 将现有商品关联到两级分类体系
-- 执行: Supabase SQL Editor
-- ============================================

-- 确保category_id列存在
ALTER TABLE studio_products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES product_categories(id);

-- 守宫类商品 → 关联到"豹纹守宫"子分类
UPDATE studio_products
SET category_id = (SELECT id FROM product_categories WHERE slug = 'leopard-gecko')
WHERE species = '守宫' AND category_id IS NULL;

-- 蛇类商品 → 关联到"玉米蛇"子分类
UPDATE studio_products
SET category_id = (SELECT id FROM product_categories WHERE slug = 'corn-snake')
WHERE species = '蛇类' AND category_id IS NULL;

-- 验证
SELECT p.name, p.species, pc.name AS category_name, pc2.name AS parent_category
FROM studio_products p
LEFT JOIN product_categories pc ON pc.id = p.category_id
LEFT JOIN product_categories pc2 ON pc2.id = pc.parent_id
ORDER BY p.created_at DESC;
