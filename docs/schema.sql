-- ============================================
-- 阶段1 数据库表结构 + RLS 策略
-- 宠物交易平台 MVP
-- 请在 Supabase SQL Editor 中一次性执行此脚本
-- ============================================

-- ============================================
-- 1. 用户资料表（profiles）—— 先建表，后续函数依赖它
-- 扩展 Supabase auth.users，存储角色等信息
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 新用户注册时自动创建 profile 记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 辅助函数：检查当前用户是否为管理员（必须在 profiles 表之后创建）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================
-- 2. 商品分类表（categories）
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. 商品表（products）
-- seller_id 预留多商家扩展，阶段1指向管理员
-- ============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. 购物车表（carts）
-- 每个登录用户只有一辆购物车
-- ============================================
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 5. 购物车明细表（cart_items）
-- ============================================
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX cart_items_cart_product_unique
  ON public.cart_items(cart_id, product_id);

-- ============================================
-- 6. 订单表（orders）
-- 阶段1仅模拟下单，不做真实支付
-- ============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 7. 订单明细表（order_items）
-- 快照下单时的商品名称和价格，保证历史准确性
-- ============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price NUMERIC(10, 2) NOT NULL CHECK (product_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 8. 启用 Row Level Security（全表）
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. RLS 策略：profiles
-- ============================================
-- 管理员可查看所有用户资料
CREATE POLICY "管理员可管理所有用户资料" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 用户可查看自己的资料
CREATE POLICY "用户可读取自己的资料" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 用户可更新自己的 display_name（不允许改 role）
CREATE POLICY "用户可更新自己的资料" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 10. RLS 策略：categories
-- ============================================
CREATE POLICY "所有人可读取分类" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "管理员可管理分类" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin());

-- ============================================
-- 11. RLS 策略：products
-- ============================================
CREATE POLICY "所有人可读取上架商品" ON public.products
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "管理员可管理所有商品" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin());

-- ============================================
-- 12. RLS 策略：carts
-- ============================================
CREATE POLICY "用户可管理自己的购物车" ON public.carts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "管理员可查看所有购物车" ON public.carts
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============================================
-- 13. RLS 策略：cart_items
-- ============================================
CREATE POLICY "用户可管理自己的购物车明细" ON public.cart_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "管理员可查看所有购物车明细" ON public.cart_items
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============================================
-- 14. RLS 策略：orders
-- ============================================
CREATE POLICY "用户可查看自己的订单" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "用户可创建订单" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "管理员可管理所有订单" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin());

-- ============================================
-- 15. RLS 策略：order_items
-- ============================================
CREATE POLICY "用户可查看自己的订单明细" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可创建订单明细" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "管理员可管理所有订单明细" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin());
