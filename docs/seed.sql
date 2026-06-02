-- 分类种子数据，请在 Supabase SQL Editor 中执行
INSERT INTO public.categories (name, slug, description, sort_order)
VALUES
  ('守宫', 'gecko', '豹纹守宫、肥尾守宫等爬宠', 1),
  ('蛇类', 'snake', '玉米蛇、王蛇、球蟒等', 2),
  ('龟类', 'turtle', '陆龟、水龟、半水龟', 3),
  ('观赏鱼', 'fish', '热带鱼、金鱼、锦鲤', 4),
  ('用品', 'supplies', '饲养箱、灯具、饲料、底材', 5),
  ('猫类', 'cats', '品种猫及猫咪用品', 6),
  ('狗类', 'dogs', '品种犬及狗狗用品', 7),
  ('鸟类', 'birds', '观赏鸟及鸟具鸟食', 8)
ON CONFLICT (slug) DO NOTHING;

-- 子分类（关联父分类）
INSERT INTO public.categories (name, slug, description, sort_order, parent_id)
SELECT '品种猫',    'cat-breeds',   '英短、美短、布偶、缅因等', 61, c.id FROM public.categories c WHERE c.slug = 'cats'
UNION ALL
SELECT '猫咪用品',  'cat-supplies',  '猫砂、猫粮、猫玩具',       62, c.id FROM public.categories c WHERE c.slug = 'cats'
UNION ALL
SELECT '猫咪健康',  'cat-health',    '驱虫药、营养品',           63, c.id FROM public.categories c WHERE c.slug = 'cats'
UNION ALL
SELECT '品种犬',    'dog-breeds',   '柴犬、柯基、泰迪、金毛',   71, c.id FROM public.categories c WHERE c.slug = 'dogs'
UNION ALL
SELECT '狗狗用品',  'dog-supplies',  '狗粮、零食、牵引绳',       72, c.id FROM public.categories c WHERE c.slug = 'dogs'
UNION ALL
SELECT '狗狗健康',  'dog-health',    '驱虫药、营养品',           73, c.id FROM public.categories c WHERE c.slug = 'dogs'
UNION ALL
SELECT '观赏鸟',    'bird-breeds',   '鹦鹉、文鸟、金丝雀',       81, c.id FROM public.categories c WHERE c.slug = 'birds'
UNION ALL
SELECT '鸟笼鸟具',  'bird-cages',    '鸟笼、栖木、食盒',         82, c.id FROM public.categories c WHERE c.slug = 'birds'
UNION ALL
SELECT '鸟食鸟药',  'bird-food',     '鸟粮、保健砂、驱虫药',     83, c.id FROM public.categories c WHERE c.slug = 'birds'
ON CONFLICT (slug) DO NOTHING;
