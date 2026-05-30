-- 修复 community_posts 分类 CHECK 约束
-- 原因：二级分类重构后允许的 category 值与旧 CHECK 约束不匹配

ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_category_check;

ALTER TABLE public.community_posts ADD CONSTRAINT community_posts_category_check
  CHECK (category IN ('', 'reptile', 'aquarium', 'general', 'fish', 'bird', 'small-pet', 'qa', 'marketplace-discuss', 'showcase', 'guide'));
