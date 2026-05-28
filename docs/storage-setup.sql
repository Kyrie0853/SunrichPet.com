-- Supabase Storage 配置
-- 请在 Supabase SQL Editor 中执行此脚本

-- 创建 product-images 存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 允许所有人读取商品图片
CREATE POLICY "所有人可读取商品图片"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- 仅管理员可上传图片
CREATE POLICY "管理员可上传商品图片"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 仅管理员可删除图片
CREATE POLICY "管理员可删除商品图片"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
