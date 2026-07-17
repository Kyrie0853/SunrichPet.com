-- ============================================
-- 工作室直营商城 — 商品评价表
-- 独立于原有 product_reviews 表
-- 请在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 创建 studio_product_reviews 表
CREATE TABLE IF NOT EXISTS public.studio_product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL DEFAULT '' CHECK (char_length(content) <= 2000),
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_studio_reviews_product
  ON public.studio_product_reviews(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_studio_reviews_user
  ON public.studio_product_reviews(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_studio_reviews_unique
  ON public.studio_product_reviews(user_id, product_id, COALESCE(order_id, '00000000-0000-0000-0000-000000000000'));

-- 3. RLS
ALTER TABLE public.studio_product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_studio_reviews_select ON public.studio_product_reviews;
CREATE POLICY rls_studio_reviews_select ON public.studio_product_reviews
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS rls_studio_reviews_insert ON public.studio_product_reviews;
CREATE POLICY rls_studio_reviews_insert ON public.studio_product_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rls_studio_reviews_update ON public.studio_product_reviews;
CREATE POLICY rls_studio_reviews_update ON public.studio_product_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rls_studio_reviews_delete ON public.studio_product_reviews;
CREATE POLICY rls_studio_reviews_delete ON public.studio_product_reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. 管理员可管理所有评价
CREATE POLICY rls_studio_reviews_admin ON public.studio_product_reviews
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 5. RPC 函数：获取商品评分汇总
CREATE OR REPLACE FUNCTION public.get_product_rating(p_product_id UUID)
RETURNS TABLE(avg_rating NUMERIC, review_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating,
    COUNT(*) AS review_count
  FROM public.studio_product_reviews
  WHERE product_id = p_product_id;
END;
$$;

DO $$ BEGIN RAISE NOTICE '✅ 工作室商品评价系统创建完成'; END $$;
