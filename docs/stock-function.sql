-- 下单时扣减库存的辅助函数
-- 请在 Supabase SQL Editor 中执行此脚本
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(stock - p_quantity, 0)
  WHERE id = p_product_id;
END;
$$;
