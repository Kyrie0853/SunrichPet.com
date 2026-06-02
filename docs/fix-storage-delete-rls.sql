-- ============================================
-- 修复: community-images Storage DELETE RLS
-- 确保用户可以删除自己上传的图片
-- ============================================

-- 重新创建 DELETE 策略（幂等）
DROP POLICY IF EXISTS "owner_delete_community_images" ON storage.objects;
CREATE POLICY "owner_delete_community_images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community-images' AND auth.uid() = owner);

-- 重新创建 UPDATE 策略（编辑帖子时需要）
DROP POLICY IF EXISTS "owner_update_community_images" ON storage.objects;
CREATE POLICY "owner_update_community_images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'community-images' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'community-images' AND auth.uid() = owner);

-- 验证所有策略
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== community-images Storage RLS 策略 ===';
  FOR r IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE '%community_images%'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  % | %', r.policyname, r.cmd;
  END LOOP;
  RAISE NOTICE '=== 策略验证完成 ===';
END $$;
