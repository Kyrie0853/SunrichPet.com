-- ============================================
-- P0-3: 商品收藏功能
-- ============================================

-- 1. 商品收藏表
CREATE TABLE IF NOT EXISTS public.product_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS fav_user_idx ON public.product_favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS fav_product_idx ON public.product_favorites(product_id);

ALTER TABLE public.product_favorites ENABLE ROW LEVEL SECURITY;

-- RLS: 用户只能管理自己的收藏（私有数据）
DROP POLICY IF EXISTS rls_fav_select ON public.product_favorites;
CREATE POLICY rls_fav_select ON public.product_favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS rls_fav_insert ON public.product_favorites;
CREATE POLICY rls_fav_insert ON public.product_favorites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rls_fav_delete ON public.product_favorites;
CREATE POLICY rls_fav_delete ON public.product_favorites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DO $$ BEGIN RAISE NOTICE '✅ 商品收藏系统创建完成'; END $$;
