-- ============================================
-- 演示商品种子数据 — 首页展示用
-- 执行方式: Supabase SQL Editor 粘贴执行
-- 作用: 在 studio_products 表中插入示范商品
-- ============================================

-- 插入守宫分类演示商品
INSERT INTO studio_products (product_id, name, species, morph, price, status, images, description) VALUES
('DEMO-001', '豹纹守宫·高黄', '守宫', '高黄', 388.00, 'available',
  ARRAY['https://images.unsplash.com/photo-1589652717406-1c69efaf1ff8?w=600'],
  '精品豹纹守宫，高黄基因，体色明亮，性格温顺，适合新手入门。'),
('DEMO-002', '睫角守宫·红系', '守宫', '红系', 680.00, 'presale',
  ARRAY['https://images.unsplash.com/photo-1596030203806-26e21aa8de86?w=600'],
  '红系睫角守宫，色彩鲜艳，约2个月后可交付。'),
('DEMO-003', '肥尾守宫·原色', '守宫', '原色', 520.00, 'available',
  ARRAY['https://images.unsplash.com/photo-1531386450561-f0a7c0d8f58a?w=600'],
  '肥尾守宫幼体，原色基因，健康活泼，已稳定进食。'),
('DEMO-004', '玉米蛇·雪白', '蛇类', '雪白', 450.00, 'available',
  ARRAY['https://images.unsplash.com/photo-1531386450561-f0a7c0d8f58a?w=600'],
  '雪白玉米蛇幼体，无鳞基因，通体洁白，非常稀有的品系。'),
('DEMO-005', '猪鼻蛇·白化', '蛇类', '白化', 880.00, 'presale',
  ARRAY['https://images.unsplash.com/photo-1531386450561-f0a7c0d8f58a?w=600'],
  '白化猪鼻蛇，西部猪鼻蛇品系，微毒无害，萌系代表宠物蛇。')
ON CONFLICT (product_id) DO UPDATE SET
  name = EXCLUDED.name, species = EXCLUDED.species, morph = EXCLUDED.morph,
  price = EXCLUDED.price, status = EXCLUDED.status, images = EXCLUDED.images,
  description = EXCLUDED.description;

-- 验证
DO $$
DECLARE
  total INT; available INT; presale INT;
BEGIN
  SELECT count(*) INTO total FROM studio_products;
  SELECT count(*) INTO available FROM studio_products WHERE status = 'available';
  SELECT count(*) INTO presale FROM studio_products WHERE status = 'presale';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  studio_products 商品统计';
  RAISE NOTICE '========================================';
  RAISE NOTICE '总商品数:  %', total;
  RAISE NOTICE '可发货:    %', available;
  RAISE NOTICE '预售中:    %', presale;
  RAISE NOTICE '========================================';
END $$;
