-- ============================================================
-- 轻量化改造：数据库迁移
-- 1. orders.user_id 改为可空（允许匿名买家下单）
-- 2. 创建 site_settings 表（收款码等站点配置）
-- ============================================================

-- ════════════════════════════════════════════════════════
-- 1. 修改 orders.user_id 为可空
-- ════════════════════════════════════════════════════════
ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL;

-- 同时修改外键约束为 SET NULL（匿名订单无用户）
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- ════════════════════════════════════════════════════════
-- 2. 创建 site_settings 表（键值对配置）
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取设置
CREATE POLICY "允许所有人读取站点设置"
  ON public.site_settings FOR SELECT
  USING (true);

-- 只允许管理员修改设置
CREATE POLICY "仅管理员可修改设置"
  ON public.site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
