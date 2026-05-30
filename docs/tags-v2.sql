-- ============================================
-- 社区标签二级分类体系
-- 请在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 添加 parent_id 字段
ALTER TABLE public.community_tags ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.community_tags(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS community_tags_parent_idx ON public.community_tags(parent_id);

-- 2. 清空旧标签并插入二级分类
DELETE FROM public.community_post_tags;
DELETE FROM public.community_tags;

-- 父分类
INSERT INTO public.community_tags (id, name, slug, color) VALUES
  ('a0000000-0000-0000-0000-000000000001', '爬宠', 'reptile', '#059669'),
  ('a0000000-0000-0000-0000-000000000002', '水族', 'aquarium', '#0284c7');

-- 爬宠子分类
INSERT INTO public.community_tags (name, slug, color, parent_id) VALUES
  ('豹纹守宫', 'leopard-gecko', '#10b981', 'a0000000-0000-0000-0000-000000000001'),
  ('睫角守宫', 'crested-gecko', '#34d399', 'a0000000-0000-0000-0000-000000000001'),
  ('玉米蛇', 'corn-snake', '#f59e0b', 'a0000000-0000-0000-0000-000000000001'),
  ('球蟒', 'ball-python', '#f97316', 'a0000000-0000-0000-0000-000000000001'),
  ('鬃狮蜥', 'bearded-dragon', '#d97706', 'a0000000-0000-0000-0000-000000000001'),
  ('蓝舌石龙子', 'blue-tongue-skink', '#65a30d', 'a0000000-0000-0000-0000-000000000001'),
  ('龟类', 'turtle', '#047857', 'a0000000-0000-0000-0000-000000000001');

-- 水族子分类
INSERT INTO public.community_tags (name, slug, color, parent_id) VALUES
  ('斗鱼', 'betta', '#06b6d4', 'a0000000-0000-0000-0000-000000000002'),
  ('灯科鱼', 'tetra', '#0891b2', 'a0000000-0000-0000-0000-000000000002'),
  ('神仙鱼', 'angelfish', '#0e7490', 'a0000000-0000-0000-0000-000000000002'),
  ('孔雀鱼', 'guppy', '#6366f1', 'a0000000-0000-0000-0000-000000000002'),
  ('短鲷', 'apistogramma', '#7c3aed', 'a0000000-0000-0000-0000-000000000002'),
  ('虾类', 'shrimp', '#ef4444', 'a0000000-0000-0000-0000-000000000002'),
  ('水草造景', 'aquascape', '#22c55e', 'a0000000-0000-0000-0000-000000000002');