-- ============================================================
-- 给我爬 v3 — 商品分类体系初始化
-- 请在 Supabase SQL Editor 中执行本文件
-- ============================================================

-- 1. 创建分类表
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES product_categories(id),
  created_at timestamptz DEFAULT now()
);

-- 2. 为 studio_products 添加 category_id 字段
ALTER TABLE studio_products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES product_categories(id);

-- 3. 插入顶级分类
INSERT INTO product_categories (name, slug) VALUES
  ('守宫', 'gecko'),
  ('蛇', 'snake')
ON CONFLICT (slug) DO NOTHING;

-- 4. 插入二级分类（守宫）
WITH top AS (SELECT id FROM product_categories WHERE slug = 'gecko')
INSERT INTO product_categories (name, slug, parent_id)
SELECT v.name, v.slug, top.id
FROM top, (VALUES
  ('豹纹守宫', 'leopard-gecko'),
  ('睫角守宫', 'crested-gecko'),
  ('肥尾守宫', 'fat-tail-gecko'),
  ('瘤尾守宫', 'knob-tail-gecko')
) AS v(name, slug)
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE slug = v.slug);

-- 5. 插入二级分类（蛇）
WITH top AS (SELECT id FROM product_categories WHERE slug = 'snake')
INSERT INTO product_categories (name, slug, parent_id)
SELECT v.name, v.slug, top.id
FROM top, (VALUES
  ('玉米蛇', 'corn-snake'),
  ('猪鼻蛇', 'hognose-snake'),
  ('束带蛇', 'garter-snake'),
  ('球蟒', 'ball-python')
) AS v(name, slug)
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE slug = v.slug);

-- 6. RLS 策略：所有人可读，仅 admin/super_admin 可写
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_read_all" ON product_categories;
CREATE POLICY "categories_read_all" ON product_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON product_categories;
CREATE POLICY "categories_insert_admin" ON product_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "categories_update_admin" ON product_categories;
CREATE POLICY "categories_update_admin" ON product_categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "categories_delete_admin" ON product_categories;
CREATE POLICY "categories_delete_admin" ON product_categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
