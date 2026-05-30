-- 商家评价系统
CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, seller_id)
);
CREATE INDEX IF NOT EXISTS seller_reviews_seller_idx ON public.seller_reviews(seller_id,created_at DESC);

ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_sr_select ON public.seller_reviews FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY rls_sr_insert ON public.seller_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid()=buyer_id);
CREATE POLICY rls_sr_update ON public.seller_reviews FOR UPDATE TO authenticated USING (auth.uid()=buyer_id);
CREATE POLICY rls_sr_delete ON public.seller_reviews FOR DELETE TO authenticated USING (auth.uid()=buyer_id);