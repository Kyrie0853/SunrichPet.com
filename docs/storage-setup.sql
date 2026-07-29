-- ============================================================
-- Supabase Storage 配置 — product-images bucket
-- 用途：商品图片/视频上传、收款码上传
-- 请先在 Supabase Dashboard → Storage 中手动创建 "product-images" bucket
-- 然后在此 SQL Editor 中执行以下语句配置权限
-- ============================================================

-- 1. 更新 bucket 配置：增大文件大小限制，添加视频格式支持
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,              -- 公开访问
  52428800,          -- 50MB（支持视频上传）
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
      'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];

-- 2. 删除旧策略（避免冲突）
DROP POLICY IF EXISTS "所有人可读取商品图片" ON storage.objects;
DROP POLICY IF EXISTS "管理员可上传商品图片" ON storage.objects;
DROP POLICY IF EXISTS "管理员可删除商品图片" ON storage.objects;
DROP POLICY IF EXISTS "允许所有人读取 public 文件" ON storage.objects;
DROP POLICY IF EXISTS "仅管理员可上传" ON storage.objects;

-- 3. 允许所有人读取图片/视频（公开访问）
CREATE POLICY "所有人可读取product-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- 4. 允许管理员(admin/super_admin)上传
CREATE POLICY "管理员可上传product-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- 5. 允许管理员删除
CREATE POLICY "管理员可删除product-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- 6. 允许管理员更新（覆盖上传）
CREATE POLICY "管理员可更新product-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
