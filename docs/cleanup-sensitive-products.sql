-- ============================================================
-- 清理敏感商品（包含保护动物关键词）
-- ============================================================

-- 删除包含保护动物名称的商品
DELETE FROM public.products
WHERE name ILIKE '%陆龟%'
   OR name ILIKE '%缅甸陆龟%'
   OR name ILIKE '%辐射陆龟%'
   OR name ILIKE '%安哥洛卡%'
   OR name ILIKE '%球蟒%'
   OR name ILIKE '%蟒蛇%'
   OR name ILIKE '%缅甸蟒%'
   OR name ILIKE '%网纹蟒%'
   OR name ILIKE '%绿水蚺%'
   OR name ILIKE '%巨蜥%'
   OR name ILIKE '%科莫多%'
   OR name ILIKE '%鳄鱼%'
   OR name ILIKE '%玳瑁%'
   OR name ILIKE '%鹦鹉%'
   OR name ILIKE '%苏卡达%'
   OR name ILIKE '%豹龟%'
   OR name ILIKE '%赫曼%'
   OR name ILIKE '%星龟%'
   OR name ILIKE '%凹甲%'
   OR name ILIKE '%四爪%'
   OR description ILIKE '%陆龟%'
   OR description ILIKE '%球蟒%'
   OR description ILIKE '%蟒蛇%'
   OR description ILIKE '%巨蜥%'
   OR description ILIKE '%鳄鱼%'
   OR description ILIKE '%苏卡达%'
   OR description ILIKE '%豹龟%'
   OR description ILIKE '%辐射陆龟%';

-- 也清理购物车中的敏感商品
DELETE FROM public.cart_items
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE name ILIKE '%陆龟%' OR name ILIKE '%球蟒%' OR name ILIKE '%蟒蛇%'
     OR name ILIKE '%巨蜥%' OR name ILIKE '%鳄鱼%' OR name ILIKE '%苏卡达%'
     OR name ILIKE '%豹龟%' OR name ILIKE '%鹦鹉%'
);

DO $$
BEGIN
  RAISE NOTICE '✅ 敏感商品清理完成';
END $$;
