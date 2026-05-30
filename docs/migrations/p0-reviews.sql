-- ============================================
-- P0-2: 商品评价系统 (Jingdong Style)
-- ============================================

-- 1. 商品评价表
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL DEFAULT '' CHECK (char_length(content) <= 2000),
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_product_idx ON public.product_reviews(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON public.product_reviews(user_id);
-- 一个用户对同一订单中的同一商品只能评价一次（如果有订单关联）
CREATE UNIQUE INDEX IF NOT EXISTS reviews_unique_idx ON public.product_reviews(user_id, product_id, COALESCE(order_id, '00000000-0000-0000-0000-000000000000'));

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS: 任何人可读
DROP POLICY IF EXISTS rls_reviews_select ON public.product_reviews;
CREATE POLICY rls_reviews_select ON public.product_reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- RLS: 登录用户可创建自己的评价
DROP POLICY IF EXISTS rls_reviews_insert ON public.product_reviews;
CREATE POLICY rls_reviews_insert ON public.product_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: 用户可编辑/删除自己的评价
DROP POLICY IF EXISTS rls_reviews_update ON public.product_reviews;
CREATE POLICY rls_reviews_update ON public.product_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rls_reviews_delete ON public.product_reviews;
CREATE POLICY rls_reviews_delete ON public.product_reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2. 触发器：更新产品的平均评分
CREATE OR REPLACE FUNCTION public.update_product_rating() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  avg_r NUMERIC;
  cnt_r INTEGER;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO avg_r, cnt_r
  FROM public.product_reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);

  -- 在 products 表添加评分字段（如果不存在）
  BEGIN
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) DEFAULT 0;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  UPDATE public.products
  SET avg_rating = ROUND(avg_r, 1), review_count = cnt_r
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_review ON public.product_reviews;
CREATE TRIGGER trg_product_review AFTER INSERT OR DELETE OR UPDATE OF rating ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

DO $$ BEGIN RAISE NOTICE '✅ 商品评价系统创建完成'; END $$;
