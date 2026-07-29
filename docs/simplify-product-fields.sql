-- ============================================================
-- 商品表单简化 — 数据库变更
-- 1. 为 product_id 添加唯一索引（自动编号用）
-- 2. 无需删除已有字段，保留历史数据兼容
-- ============================================================

-- 为 product_id 添加唯一索引（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_studio_products_product_id'
  ) THEN
    CREATE UNIQUE INDEX idx_studio_products_product_id ON public.studio_products (product_id);
  END IF;
END $$;
