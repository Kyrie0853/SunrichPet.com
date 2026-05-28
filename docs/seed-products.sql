-- 测试商品种子数据
-- 请先在 Supabase SQL Editor 中确认分类数据已导入（docs/seed.sql），然后执行此文件
-- 注意：seller_id 需要替换为你的管理员用户 UUID

-- 用一个变量设置你的管理员 UUID（请替换为你的实际用户 ID）
DO $$
DECLARE
  admin_id UUID;
  gecko_id UUID;
  snake_id UUID;
  turtle_id UUID;
  fish_id UUID;
  supplies_id UUID;
BEGIN
  -- 获取你的管理员用户 ID（替换为你的实际 UUID）
  -- 在 Supabase Dashboard → Authentication → Users 中可以找到
  SELECT id INTO admin_id FROM auth.users LIMIT 1;

  -- 获取分类 ID
  SELECT id INTO gecko_id FROM public.categories WHERE slug = 'gecko';
  SELECT id INTO snake_id FROM public.categories WHERE slug = 'snake';
  SELECT id INTO turtle_id FROM public.categories WHERE slug = 'turtle';
  SELECT id INTO fish_id FROM public.categories WHERE slug = 'fish';
  SELECT id INTO supplies_id FROM public.categories WHERE slug = 'supplies';

  -- 仅在分类存在时插入商品
  IF admin_id IS NOT NULL THEN

    -- 守宫
    IF gecko_id IS NOT NULL THEN
      INSERT INTO public.products (seller_id, category_id, name, slug, description, price, stock, status)
      VALUES
        (admin_id, gecko_id, '高黄豹纹守宫', 'high-yellow-leopard-gecko', '经典高黄品系豹纹守宫，温顺易上手，适合新手饲养。体长约15-20cm，已经开食。', 298.00, 5, 'active'),
        (admin_id, gecko_id, '橘化豹纹守宫', 'tangerine-leopard-gecko', '鲜艳橘化品系，色彩明亮，性格温顺。已定色，体长约18cm。', 598.00, 3, 'active'),
        (admin_id, gecko_id, '超级雪花守宫', 'super-snow-gecko', '稀有超级雪花品系，独特黑白花纹。成年个体，状态极佳。', 1280.00, 1, 'active')
      ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- 蛇类
    IF snake_id IS NOT NULL THEN
      INSERT INTO public.products (seller_id, category_id, name, slug, description, price, stock, status)
      VALUES
        (admin_id, snake_id, '原色玉米蛇', 'classic-corn-snake', '原色玉米蛇幼体，已开食冻鼠。体长约30cm，性格温顺，非常适合新手。', 388.00, 4, 'active'),
        (admin_id, snake_id, '雪白玉米蛇', 'snow-corn-snake', '纯白品系玉米蛇，成年个体，状态极佳。体长约120cm，观赏性极高。', 880.00, 2, 'active'),
        (admin_id, snake_id, '加州王蛇', 'california-king-snake', '黑白环纹加州王蛇，性格活跃，饲养简单。幼体已开食。', 520.00, 0, 'active')
      ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- 龟类
    IF turtle_id IS NOT NULL THEN
      INSERT INTO public.products (seller_id, category_id, name, slug, description, price, stock, status)
      VALUES
        (admin_id, turtle_id, '赫曼陆龟', 'hermanns-tortoise', 'CB赫曼陆龟幼体，壳长约5cm，健康活跃。已适应人工环境，饲养难度低。', 680.00, 3, 'active'),
        (admin_id, turtle_id, '红腿陆龟', 'red-footed-tortoise', '红腿陆龟亚成体，壳长约12cm。色彩鲜艳，互动性好，适合中级玩家。', 1200.00, 1, 'active')
      ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- 观赏鱼
    IF fish_id IS NOT NULL THEN
      INSERT INTO public.products (seller_id, category_id, name, slug, description, price, stock, status)
      VALUES
        (admin_id, fish_id, '泰国斗鱼半月', 'halfmoon-betta', '半月泰国斗鱼，色彩艳丽，鱼鳍展开如满月。单养，配精美玻璃瓶。', 68.00, 10, 'active'),
        (admin_id, fish_id, '霓虹灯鱼（10条组）', 'neon-tetra-pack', '群游效果极佳的灯科鱼，体长约2cm。10条起售，适合草缸。', 45.00, 20, 'active'),
        (admin_id, fish_id, '水晶虾（5只组）', 'crystal-red-shrimp-pack', '红色水晶虾，品相优秀。5只一组，适合水草缸观赏。', 88.00, 8, 'active')
      ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- 用品
    IF supplies_id IS NOT NULL THEN
      INSERT INTO public.products (seller_id, category_id, name, slug, description, price, stock, status)
      VALUES
        (admin_id, supplies_id, '爬宠恒温加热垫', 'reptile-heat-pad', '可调温加热垫，14W，尺寸28x28cm。适合守宫、蛇类等爬宠使用，节能安全。', 49.00, 15, 'active'),
        (admin_id, supplies_id, '椰土砖（3块装）', 'coco-fiber-brick-pack', '天然椰土压缩砖，每块可膨胀约8L。适合雨林类爬宠垫材。', 28.00, 20, 'active'),
        (admin_id, supplies_id, 'UVB5.0爬宠灯', 'uvb-5-reptile-lamp', '爬宠专用UVB灯管，促进钙质吸收。13W，适用大多数日行爬宠。', 85.00, 10, 'active')
      ON CONFLICT (slug) DO NOTHING;
    END IF;

  END IF;
END $$;
