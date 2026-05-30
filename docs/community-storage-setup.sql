-- ============================================
-- 社区论坛 Storage 配置
-- 请在 Supabase SQL Editor 中执行
-- ============================================

-- 创建存储桶（也可在 Supabase Dashboard 手动创建）
-- 名称: community-images  访问权限: public

-- Storage RLS 策略（先删后建，支持重复执行）
DROP POLICY IF EXISTS "public_read_community_images" ON storage.objects;
CREATE POLICY "public_read_community_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-images');

DROP POLICY IF EXISTS "authenticated_upload_community_images" ON storage.objects;
CREATE POLICY "authenticated_upload_community_images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "owner_update_community_images" ON storage.objects;
CREATE POLICY "owner_update_community_images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'community-images' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'community-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "owner_delete_community_images" ON storage.objects;
CREATE POLICY "owner_delete_community_images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'community-images' AND auth.uid() = owner);