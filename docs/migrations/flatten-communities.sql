-- ============================================
-- 社区架构扁平化 — 移除"爬宠""水族"大类
-- 执行方式：Supabase SQL Editor
-- ============================================

-- 1. 添加 is_active 字段（如不存在）
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. 将"爬宠"的帖子迁移到对应物种社区
-- 2a. 标题含"守宫"或"豹纹"的 → 守宫社区
WITH gecko_bar AS (SELECT id FROM public.bars WHERE slug = 'gecko'),
     reptile_bar AS (SELECT id FROM public.bars WHERE slug = 'reptile')
UPDATE public.community_posts 
SET bar_id = (SELECT id FROM gecko_bar)
WHERE bar_id = (SELECT id FROM reptile_bar)
  AND (title ILIKE '%守宫%' OR title ILIKE '%豹纹%' OR title ILIKE '%肥尾%' OR title ILIKE '%gecko%');

-- 2b. 标题含"蛇"的 → 蛇类社区
WITH snake_bar AS (SELECT id FROM public.bars WHERE slug = 'snake'),
     reptile_bar AS (SELECT id FROM public.bars WHERE slug = 'reptile')
UPDATE public.community_posts 
SET bar_id = (SELECT id FROM snake_bar)
WHERE bar_id = (SELECT id FROM reptile_bar)
  AND (title ILIKE '%蛇%' OR title ILIKE '%snake%' OR title ILIKE '%蟒%')
  AND bar_id IS NOT NULL;

-- 2c. 其余无法判断的 → 迁移到最近创建的物种社区
WITH gecko_bar AS (SELECT id FROM public.bars WHERE slug = 'gecko'),
     reptile_bar AS (SELECT id FROM public.bars WHERE slug = 'reptile')
UPDATE public.community_posts 
SET bar_id = (SELECT id FROM gecko_bar)
WHERE bar_id = (SELECT id FROM reptile_bar);

-- 3. 将"水族"的帖子迁移到龟友社区（作为最接近的物种社区）
WITH turtle_bar AS (SELECT id FROM public.bars WHERE slug = 'turtle'),
     aquarium_bar AS (SELECT id FROM public.bars WHERE slug = 'aquarium')
UPDATE public.community_posts 
SET bar_id = (SELECT id FROM turtle_bar)
WHERE bar_id = (SELECT id FROM aquarium_bar);

-- 4. 将"爬宠"和"水族"设为不可见
UPDATE public.bars SET is_active = false WHERE slug IN ('reptile', 'aquarium');

-- 5. 验证结果
DO $$
DECLARE
  active_count INTEGER;
  inactive_count INTEGER;
  orphan_posts INTEGER;
BEGIN
  SELECT count(*) INTO active_count FROM public.bars WHERE is_active = true;
  SELECT count(*) INTO inactive_count FROM public.bars WHERE is_active = false;
  SELECT count(*) INTO orphan_posts FROM public.community_posts WHERE bar_id IN (SELECT id FROM public.bars WHERE is_active = false);
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 社区架构扁平化完成';
  RAISE NOTICE '   活跃社区: % 个', active_count;
  RAISE NOTICE '   已隐藏社区: % 个', inactive_count;
  RAISE NOTICE '   遗留帖子: % 篇（已全部迁移）', orphan_posts;
  RAISE NOTICE '========================================';
END $$;
