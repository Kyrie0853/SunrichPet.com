-- ============================================
-- SunrichPet 社区论坛 数据库表结构 + RLS 策略
-- 宠物玩家社区模块
-- ============================================

-- 扩展 profiles：社区字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================
-- 1. community_posts 帖子表
-- ============================================
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) >= 10),
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general','reptile','fish','bird','small-pet','qa','marketplace-discuss','showcase','guide')),
  images TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cp_search_idx ON public.community_posts USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));
CREATE INDEX cp_created_idx ON public.community_posts(created_at DESC);
CREATE INDEX cp_author_idx ON public.community_posts(author_id);
CREATE INDEX cp_category_idx ON public.community_posts(category);

-- ============================================
-- 2. community_comments 评论表
-- ============================================
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cc_post_idx ON public.community_comments(post_id, created_at ASC);
CREATE INDEX cc_author_idx ON public.community_comments(author_id);
CREATE INDEX cc_parent_idx ON public.community_comments(parent_id);

-- ============================================
-- 3. community_likes 点赞表
-- ============================================
CREATE TABLE public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cl_target_check CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL)),
  UNIQUE (user_id, post_id, comment_id)
);

CREATE INDEX cl_post_idx ON public.community_likes(post_id);
CREATE INDEX cl_comment_idx ON public.community_likes(comment_id);
CREATE INDEX cl_user_idx ON public.community_likes(user_id);


-- ============================================
-- 4. community_favorites 收藏表
-- ============================================
CREATE TABLE public.community_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

CREATE INDEX cf_user_idx ON public.community_favorites(user_id);
CREATE INDEX cf_post_idx ON public.community_favorites(post_id);

-- ============================================
-- 5. user_follows 关注表
-- ============================================
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX uf_follower_idx ON public.user_follows(follower_id);
CREATE INDEX uf_following_idx ON public.user_follows(following_id);

-- ============================================
-- 6. community_tags 标签表
-- ============================================
CREATE TABLE public.community_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 30),
  slug TEXT NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 1 AND 30),
  color TEXT DEFAULT '#10b981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 7. community_post_tags 帖子标签关联表
-- ============================================
CREATE TABLE public.community_post_tags (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.community_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);


-- ============================================
-- 启用 Row Level Security
-- ============================================
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_tags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS: community_posts
-- ============================================
CREATE POLICY rls_cp_read ON public.community_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY rls_cp_insert ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY rls_cp_update ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY rls_cp_delete ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY rls_cp_admin ON public.community_posts FOR ALL TO authenticated USING (public.is_admin());

-- RLS: community_comments
CREATE POLICY rls_cc_read ON public.community_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY rls_cc_insert ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY rls_cc_update ON public.community_comments FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY rls_cc_delete ON public.community_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY rls_cc_admin ON public.community_comments FOR ALL TO authenticated USING (public.is_admin());

-- RLS: community_likes
CREATE POLICY rls_cl_read ON public.community_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY rls_cl_insert ON public.community_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY rls_cl_delete ON public.community_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS: community_favorites (私有)
CREATE POLICY rls_cf_read ON public.community_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY rls_cf_insert ON public.community_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY rls_cf_delete ON public.community_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS: user_follows
CREATE POLICY rls_uf_read ON public.user_follows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY rls_uf_insert ON public.user_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY rls_uf_delete ON public.user_follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- RLS: community_tags
CREATE POLICY rls_ct_read ON public.community_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY rls_ct_admin ON public.community_tags FOR ALL TO authenticated USING (public.is_admin());

-- RLS: community_post_tags
CREATE POLICY rls_cpt_read ON public.community_post_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY rls_cpt_author ON public.community_post_tags FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.community_posts WHERE community_posts.id = community_post_tags.post_id AND community_posts.author_id = auth.uid()));
CREATE POLICY rls_cpt_admin ON public.community_post_tags FOR ALL TO authenticated USING (public.is_admin());

-- ============================================
-- 辅助函数
-- ============================================
CREATE OR REPLACE FUNCTION public.get_post_like_count(p_post_id UUID)
RETURNS INTEGER LANGUAGE sql STABLE
AS $$ SELECT COUNT(*)::INTEGER FROM public.community_likes WHERE community_likes.post_id = p_post_id; $$;

CREATE OR REPLACE FUNCTION public.get_post_comment_count(p_post_id UUID)
RETURNS INTEGER LANGUAGE sql STABLE
AS $$ SELECT COUNT(*)::INTEGER FROM public.community_comments WHERE community_comments.post_id = p_post_id; $$;

-- 预置论坛标签数据
INSERT INTO public.community_tags (name, slug, color) VALUES
  (E'守宫', 'gecko', '#10b981'),
  (E'蛇类', 'snake', '#f59e0b'),
  (E'龟类', 'turtle', '#3b82f6'),
  (E'观赏鱼', 'fish', '#06b6d4'),
  (E'鸟类', 'bird', '#8b5cf6'),
  (E'小宠', 'small-pet', '#ec4899'),
  (E'饲养教程', 'guide', '#14b8a6'),
  (E'疾病求助', 'health', '#ef4444'),
  (E'开箱分享', 'unboxing', '#f97316'),
  (E'器材评测', 'gear', '#6366f1')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 自动更新 updated_at 触发器
-- ============================================
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS community_posts_updated_at ON public.community_posts;
CREATE TRIGGER community_posts_updated_at BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS community_comments_updated_at ON public.community_comments;
CREATE TRIGGER community_comments_updated_at BEFORE UPDATE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
