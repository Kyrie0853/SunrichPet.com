-- 分类种子数据，请在 Supabase SQL Editor 中执行
INSERT INTO public.categories (name, slug, description, sort_order)
VALUES
  ('守宫', 'gecko', '豹纹守宫、肥尾守宫等爬宠', 1),
  ('蛇类', 'snake', '玉米蛇、王蛇、球蟒等', 2),
  ('龟类', 'turtle', '陆龟、水龟、半水龟', 3),
  ('观赏鱼', 'fish', '热带鱼、金鱼、锦鲤', 4),
  ('用品', 'supplies', '饲养箱、灯具、饲料、底材', 5)
ON CONFLICT (slug) DO NOTHING;
