-- ============================================
-- 社区论坛 Storage 配置
-- 请在 Supabase SQL Editor 中执行
-- ============================================

-- 创建存储桶（也可在 Supabase Dashboard 手动创建）
-- 名称: community-images  访问权限: public

-- Storage RLS 策略
-- 所有人可读
CREATE POLICY "public_read_community_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-images');

-- 登录用户可上传（限制类型和大小通过 API 层控制）
CREATE POLICY "authenticated_upload_community_images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-images' AND auth.uid() = owner);

-- 用户可删除自己上传的图片
CREATE POLICY "owner_delete_community_images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'community-images' AND auth.uid() = owner);