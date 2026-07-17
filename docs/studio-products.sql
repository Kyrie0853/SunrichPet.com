-- ============================================
-- studio_products 表 — 个人爬宠工作室直营商城
-- 独立于原有 products 表，用于展示在售爬宠个体
-- 请在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 创建 studio_products 表
CREATE TABLE IF NOT EXISTS public.studio_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  morph TEXT,
  birth_date DATE,
  current_weight TEXT,
  personality_tags TEXT[] DEFAULT '{}',
  estimated_ship_date DATE,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'presale'
    CHECK (status IN ('presale', 'available', 'sold')),
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_studio_products_status ON public.studio_products(status);
CREATE INDEX IF NOT EXISTS idx_studio_products_species ON public.studio_products(species);
CREATE INDEX IF NOT EXISTS idx_studio_products_created_at ON public.studio_products(created_at DESC);

-- 3. 自动更新触发器
CREATE OR REPLACE FUNCTION public.update_studio_products_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_studio_products_updated_at ON public.studio_products;
CREATE TRIGGER trigger_studio_products_updated_at
  BEFORE UPDATE ON public.studio_products
  FOR EACH ROW EXECUTE FUNCTION public.update_studio_products_updated_at();

-- 4. RLS
ALTER TABLE public.studio_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可读取在售商品" ON public.studio_products;
CREATE POLICY "所有人可读取在售商品" ON public.studio_products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "管理员可管理所有商品" ON public.studio_products;
CREATE POLICY "管理员可管理所有商品" ON public.studio_products
  FOR ALL TO authenticated USING (public.is_admin());

-- 5. 订单表扩展字段（安全添加）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='seller_id') THEN
    ALTER TABLE public.orders ADD COLUMN seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_address') THEN
    ALTER TABLE public.orders ADD COLUMN shipping_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'manual';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='paid_at') THEN
    ALTER TABLE public.orders ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipped_at') THEN
    ALTER TABLE public.orders ADD COLUMN shipped_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='confirmed_at') THEN
    ALTER TABLE public.orders ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_number') THEN
    ALTER TABLE public.orders ADD COLUMN tracking_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_company') THEN
    ALTER TABLE public.orders ADD COLUMN tracking_company TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='inspection_deadline') THEN
    ALTER TABLE public.orders ADD COLUMN inspection_deadline TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='alipay_trade_no') THEN
    ALTER TABLE public.orders ADD COLUMN alipay_trade_no TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='product_id') THEN
    ALTER TABLE public.orders ADD COLUMN product_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='product_name') THEN
    ALTER TABLE public.orders ADD COLUMN product_name TEXT;
  END IF;
END $$;

-- 6. 博客表
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 补加 tags 列（如果表已存在但缺少 tags 列）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='tags') THEN
    ALTER TABLE public.blog_posts ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可读取已发布博客" ON public.blog_posts;
CREATE POLICY "所有人可读取已发布博客" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now());

DROP POLICY IF EXISTS "管理员可管理博客" ON public.blog_posts;
CREATE POLICY "管理员可管理博客" ON public.blog_posts
  FOR ALL TO authenticated USING (public.is_admin());
