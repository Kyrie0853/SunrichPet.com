-- ============================================================
-- 支付与担保交易 — 数据库迁移
-- ============================================================

-- 1. seller_balances 商家余额表
CREATE TABLE IF NOT EXISTS public.seller_balances (
  seller_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance NUMERIC(12,2) DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance NUMERIC(12,2) DEFAULT 0 CHECK (pending_balance >= 0),
  total_earned NUMERIC(12,2) DEFAULT 0 CHECK (total_earned >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "商家可读自己的余额" ON public.seller_balances FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "管理员可管理余额" ON public.seller_balances FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
);

-- 2. order_logs 订单操作日志
CREATE TABLE IF NOT EXISTS public.order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  operator_id UUID REFERENCES auth.users(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "管理员可读订单日志" ON public.order_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
);
CREATE POLICY "用户可读自己订单日志" ON public.order_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_logs.order_id AND orders.user_id = auth.uid())
);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON public.order_logs(order_id);

-- 3. orders 表扩展
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_company TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS inspection_deadline TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- profiles 商家扩展字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shop_notice TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_wechat TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- 更新状态约束
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('pending', 'paid', 'shipped', 'completed', 'refunding', 'refunded', 'cancelled')
);

-- 4. 为管理员日志表确保存在
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 5. 自动创建 seller_balances 的函数
CREATE OR REPLACE FUNCTION public.ensure_seller_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.role = 'seller' THEN
    INSERT INTO public.seller_balances (seller_id, available_balance, pending_balance, total_earned)
    VALUES (NEW.id, 0, 0, 0)
    ON CONFLICT (seller_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_seller_balance ON public.profiles;
CREATE TRIGGER trg_ensure_seller_balance
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_seller_balance();

-- 6. 结算函数：订单完成 → pending → available
CREATE OR REPLACE FUNCTION public.settle_order_balance(p_order_id UUID, p_amount NUMERIC)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  SELECT seller_id INTO v_seller_id FROM public.orders WHERE id = p_order_id;
  IF v_seller_id IS NOT NULL THEN
    -- 确保 balance 记录存在
    INSERT INTO public.seller_balances (seller_id, available_balance, pending_balance, total_earned)
    VALUES (v_seller_id, 0, 0, 0)
    ON CONFLICT (seller_id) DO NOTHING;
    -- 结算
    UPDATE public.seller_balances
    SET pending_balance = pending_balance - p_amount,
        available_balance = available_balance + p_amount,
        total_earned = total_earned + p_amount,
        updated_at = now()
    WHERE seller_id = v_seller_id;
  END IF;
END;
$$;

-- 7. 退款回退函数
CREATE OR REPLACE FUNCTION public.reverse_order_balance(p_order_id UUID, p_amount NUMERIC)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  SELECT seller_id INTO v_seller_id FROM public.orders WHERE id = p_order_id;
  IF v_seller_id IS NOT NULL THEN
    UPDATE public.seller_balances
    SET pending_balance = GREATEST(pending_balance - p_amount, 0),
        updated_at = now()
    WHERE seller_id = v_seller_id;
  END IF;
END;
$$;

-- 8. 支付成功后自动更新 pending_balance
CREATE OR REPLACE FUNCTION public.on_order_paid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
    IF NEW.seller_id IS NOT NULL AND NEW.total_amount > 0 THEN
      INSERT INTO public.seller_balances (seller_id, available_balance, pending_balance, total_earned)
      VALUES (NEW.seller_id, 0, NEW.total_amount, 0)
      ON CONFLICT (seller_id) DO UPDATE
      SET pending_balance = seller_balances.pending_balance + NEW.total_amount,
          updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_order_paid ON public.orders;
CREATE TRIGGER trg_on_order_paid
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status = 'pending')
  EXECUTE FUNCTION public.on_order_paid();

DO $$ BEGIN RAISE NOTICE 'Payment escrow migration complete!'; END $$;
