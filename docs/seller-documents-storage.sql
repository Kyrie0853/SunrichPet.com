-- ============================================
-- 商家入驻证件存储配置 (2026-06-02)
-- ============================================

-- 1. 创建 bucket（需在 Supabase Dashboard 或 SQL 中手动创建）
-- Dashboard → Storage → New Bucket → Name: seller-documents
-- Settings: Public bucket = OFF (private)

-- 2. RLS 策略：仅管理员可读取所有文件
-- 注意：这些策略依赖 storage.objects 表，需要在 Storage 已创建 bucket 后执行

-- 管理员可读所有证件文件
DROP POLICY IF EXISTS "Admin can read seller documents" ON storage.objects;
CREATE POLICY "Admin can read seller documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'seller-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
  );

-- 认证用户可上传自己的文件
DROP POLICY IF EXISTS "Users can upload their documents" ON storage.objects;
CREATE POLICY "Users can upload their documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'seller-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. 确认 seller_applications 包含必需字段
DO $$
BEGIN
  ALTER TABLE public.seller_applications ADD COLUMN IF NOT EXISTS id_card_front_url TEXT;
  ALTER TABLE public.seller_applications ADD COLUMN IF NOT EXISTS id_card_back_url TEXT;
  ALTER TABLE public.seller_applications ADD COLUMN IF NOT EXISTS business_license_url TEXT;
  ALTER TABLE public.seller_applications ADD COLUMN IF NOT EXISTS health_cert_url TEXT;
END $$;

-- 4. 验证
DO $$
BEGIN
  RAISE NOTICE 'Seller documents storage configuration complete';
  RAISE NOTICE 'Next: Create "seller-documents" bucket in Supabase Dashboard (uncheck Public)';
END $$;
