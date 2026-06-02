-- ============================================
-- 商城品类扩展：新增猫、狗、鸟分类 (2026-06-02)
-- ============================================

-- 1. 分类表增加 parent_id 支持二级分类
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- 2. 商品表增加疫苗情况字段（猫狗活体）
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vaccination TEXT;
-- vaccination 可选值: 'vaccinated' | 'not_vaccinated' | 'in_progress'

-- 3. 插入三大父分类
INSERT INTO public.categories (name, slug, description, sort_order, parent_id) VALUES
  ('猫类', 'cats', '英短、美短、布偶、缅因等品种猫及猫咪用品', 6, NULL),
  ('狗类', 'dogs', '柴犬、柯基、泰迪、金毛等品种犬及狗狗用品', 7, NULL),
  ('鸟类', 'birds', '鹦鹉、文鸟、金丝雀等观赏鸟及鸟具鸟食', 8, NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  parent_id = EXCLUDED.parent_id;

-- 4. 插入 9 个子分类（关联父分类）
WITH cats_parent AS (SELECT id FROM public.categories WHERE slug = 'cats'),
     dogs_parent AS (SELECT id FROM public.categories WHERE slug = 'dogs'),
     birds_parent AS (SELECT id FROM public.categories WHERE slug = 'birds')
INSERT INTO public.categories (name, slug, description, sort_order, parent_id) VALUES
  -- 猫类子分类
  ('品种猫',    'cat-breeds',   '英短、美短、布偶、缅因等品种猫',        61, (SELECT id FROM cats_parent)),
  ('猫咪用品',  'cat-supplies',  '猫砂、猫粮、猫玩具、猫爬架',           62, (SELECT id FROM cats_parent)),
  ('猫咪健康',  'cat-health',    '驱虫药、营养品、洗护用品',             63, (SELECT id FROM cats_parent)),
  -- 狗类子分类
  ('品种犬',    'dog-breeds',   '柴犬、柯基、泰迪、金毛等品种犬',        71, (SELECT id FROM dogs_parent)),
  ('狗狗用品',  'dog-supplies',  '狗粮、零食、牵引绳、狗窝',             72, (SELECT id FROM dogs_parent)),
  ('狗狗健康',  'dog-health',    '驱虫药、营养品、洗护用品',             73, (SELECT id FROM dogs_parent)),
  -- 鸟类子分类
  ('观赏鸟',    'bird-breeds',   '鹦鹉、文鸟、金丝雀等观赏鸟',           81, (SELECT id FROM birds_parent)),
  ('鸟笼鸟具',  'bird-cages',    '鸟笼、栖木、食盒、饮水器',             82, (SELECT id FROM birds_parent)),
  ('鸟食鸟药',  'bird-food',     '鸟粮、保健砂、驱虫药',                 83, (SELECT id FROM birds_parent))
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  parent_id = EXCLUDED.parent_id;

-- 5. 验证
DO $$
DECLARE
  r RECORD;
  parent_count INTEGER;
  child_count INTEGER;
  total_count INTEGER;
BEGIN
  RAISE NOTICE '========== 商城品类扩展结果 ==========';

  SELECT count(*) INTO parent_count FROM public.categories WHERE parent_id IS NULL;
  SELECT count(*) INTO child_count FROM public.categories WHERE parent_id IS NOT NULL;
  SELECT count(*) INTO total_count FROM public.categories;

  RAISE NOTICE '父分类: % | 子分类: % | 总计: %', parent_count, child_count, total_count;

  FOR r IN
    SELECT c.slug, c.name, c.sort_order,
           CASE WHEN c.parent_id IS NULL THEN '父' ELSE '  └ 子' END AS level,
           COALESCE(pc.name, '-') AS parent_name
    FROM public.categories c
    LEFT JOIN public.categories pc ON pc.id = c.parent_id
    ORDER BY COALESCE(pc.sort_order, c.sort_order), c.sort_order
  LOOP
    RAISE NOTICE '  % | % | sort=% | parent=%',
      rpad(r.level, 8), rpad(r.name || ' (' || r.slug || ')', 35), r.sort_order, r.parent_name;
  END LOOP;

  RAISE NOTICE '✅ 商城品类扩展完成';
END $$;
