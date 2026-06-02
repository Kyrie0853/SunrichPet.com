-- ============================================
-- 社区 v2 结构调整：精简名称 + 新增品类社区
-- 执行日期：2026-06-02
-- ============================================

-- 一、现有社区改名
-- 守宫爬宠区 → 守宫区
UPDATE public.bars SET name = '守宫区' WHERE slug = 'gecko';

-- 观赏鱼水区 → 观赏鱼区
UPDATE public.bars SET name = '观赏鱼区' WHERE slug = 'aquarium';

-- 龟类区 → 龟友区（统一名称）
UPDATE public.bars SET name = '龟友区' WHERE slug = 'turtle';

-- 二、新增 4 个品类社区
INSERT INTO public.bars (slug, name, description, icon, is_active)
VALUES
  ('snake', '蛇区', '玉米蛇、球蟒等宠物蛇爱好者交流区', '🐍', true),
  ('cat',   '猫区', '猫咪铲屎官日常、品种交流、领养信息', '🐱', true),
  ('dog',   '狗区', '狗狗饲养、训练、健康知识分享', '🐶', true),
  ('bird',  '鸟区', '鹦鹉、文鸟等宠物鸟爱好者聚集地', '🐦', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = true;

-- 三、确保所有 8 个社区均为活跃状态
UPDATE public.bars SET is_active = true
WHERE slug IN ('gecko', 'turtle', 'aquarium', 'newbie', 'snake', 'cat', 'dog', 'bird');

-- 四、禁用旧版/未使用的社区
UPDATE public.bars SET is_active = false
WHERE slug NOT IN ('gecko', 'turtle', 'aquarium', 'newbie', 'snake', 'cat', 'dog', 'bird');

-- 五、验证结果
DO $$
DECLARE
  bar_record RECORD;
  active_count INTEGER;
  inactive_count INTEGER;
BEGIN
  RAISE NOTICE '========== 社区 v2 结构调整结果 ==========';
  FOR bar_record IN
    SELECT slug, name, icon, is_active, member_count, post_count
    FROM public.bars
    ORDER BY
      CASE slug
        WHEN 'gecko' THEN 1 WHEN 'turtle' THEN 2 WHEN 'aquarium' THEN 3
        WHEN 'snake' THEN 4 WHEN 'cat' THEN 5 WHEN 'dog' THEN 6
        WHEN 'bird' THEN 7 WHEN 'newbie' THEN 8
        ELSE 99
      END
  LOOP
    RAISE NOTICE '  % | % | % | active=% | members=% | posts=%',
      bar_record.slug, bar_record.name, bar_record.icon,
      bar_record.is_active, bar_record.member_count, bar_record.post_count;
  END LOOP;

  SELECT count(*) INTO active_count FROM public.bars WHERE is_active = true;
  SELECT count(*) INTO inactive_count FROM public.bars WHERE is_active = false;
  RAISE NOTICE '---';
  RAISE NOTICE '活跃社区: % | 非活跃社区: %', active_count, inactive_count;
  RAISE NOTICE '✅ 社区 v2 结构调整完成';
END $$;
