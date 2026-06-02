-- ============================================
-- 修复：放宽 community_posts content 约束
-- 问题：手机端发帖仅上传图片时报错
--       violates check constraint "community_posts_content_check"
-- 根因：content TEXT NOT NULL CHECK (char_length(content) >= 10)
-- ============================================

-- 1. 删除旧的严格约束
ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_content_check;

-- 2. 改为宽松约束：content 可为空字符串，最大 50000 字
ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_content_check
  CHECK (content IS NULL OR char_length(content) <= 50000);

-- 3. 确保 content 字段允许空字符串（设为默认值）
ALTER TABLE public.community_posts ALTER COLUMN content SET DEFAULT '';

-- 4. 验证
DO $$
DECLARE
  constraint_def TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'community_posts_content_check';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'community_posts_content_check 已更新为:';
  RAISE NOTICE '%', constraint_def;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 约束已放宽：允许仅图片发帖、仅标题发帖';
END $$;
