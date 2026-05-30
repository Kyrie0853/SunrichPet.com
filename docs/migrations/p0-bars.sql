-- ============================================
-- P0-1: 社区"吧"体系 (Baidu Tieba Style)
-- ============================================

-- 1. 吧表
CREATE TABLE IF NOT EXISTS public.bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🐾',
  member_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 吧成员表
CREATE TABLE IF NOT EXISTS public.bar_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bar_id, user_id)
);
CREATE INDEX IF NOT EXISTS bar_members_bar_idx ON public.bar_members(bar_id);
CREATE INDEX IF NOT EXISTS bar_members_user_idx ON public.bar_members(user_id);

-- 3. community_posts 添加 bar_id 字段
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS bar_id UUID REFERENCES public.bars(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS posts_bar_idx ON public.community_posts(bar_id);

-- 4. 预设 5 个吧
INSERT INTO public.bars (slug, name, description, icon) VALUES
  ('reptile', '爬宠', '守宫、蜥蜴、蛇等爬行动物爱好者聚集地', '🦎'),
  ('aquarium', '水族', '观赏鱼、虾、水草造景交流', '🐠'),
  ('gecko', '守宫', '豹纹守宫、肥尾守宫等守宫玩家专区', '🦎'),
  ('turtle', '龟友', '陆龟、水龟、半水龟饲养交流', '🐢'),
  ('snake', '蛇类', '玉米蛇、王蛇、球蟒等宠物蛇交流', '🐍')
ON CONFLICT (slug) DO NOTHING;

-- 5. RLS 策略

ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_members ENABLE ROW LEVEL SECURITY;

-- bars: 任何人可读
DROP POLICY IF EXISTS rls_bars_select ON public.bars;
CREATE POLICY rls_bars_select ON public.bars
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS rls_bars_insert ON public.bars;
CREATE POLICY rls_bars_insert ON public.bars
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- bar_members: 任何人可读
DROP POLICY IF EXISTS rls_bar_members_select ON public.bar_members;
CREATE POLICY rls_bar_members_select ON public.bar_members
  FOR SELECT TO anon, authenticated
  USING (true);

-- bar_members: 登录用户可加入/退出
DROP POLICY IF EXISTS rls_bar_members_insert ON public.bar_members;
CREATE POLICY rls_bar_members_insert ON public.bar_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rls_bar_members_delete ON public.bar_members;
CREATE POLICY rls_bar_members_delete ON public.bar_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6. 触发器：自动更新吧的 member_count 和 post_count
CREATE OR REPLACE FUNCTION public.update_bar_counts() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_TABLE_NAME = 'bar_members' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.bars SET member_count = (SELECT count(*) FROM public.bar_members WHERE bar_id = NEW.bar_id) WHERE id = NEW.bar_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.bars SET member_count = (SELECT count(*) FROM public.bar_members WHERE bar_id = OLD.bar_id) WHERE id = OLD.bar_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_posts' THEN
    IF TG_OP = 'INSERT' AND NEW.bar_id IS NOT NULL THEN
      UPDATE public.bars SET post_count = (SELECT count(*) FROM public.community_posts WHERE bar_id = NEW.bar_id) WHERE id = NEW.bar_id;
    ELSIF TG_OP = 'DELETE' AND OLD.bar_id IS NOT NULL THEN
      UPDATE public.bars SET post_count = (SELECT count(*) FROM public.community_posts WHERE bar_id = OLD.bar_id) WHERE id = OLD.bar_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_bar_members_count ON public.bar_members;
CREATE TRIGGER trg_bar_members_count AFTER INSERT OR DELETE ON public.bar_members
  FOR EACH ROW EXECUTE FUNCTION public.update_bar_counts();

DROP TRIGGER IF EXISTS trg_bar_posts_count ON public.community_posts;
CREATE TRIGGER trg_bar_posts_count AFTER INSERT OR DELETE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_bar_counts();

DO $$ BEGIN RAISE NOTICE '✅ 吧体系创建完成'; END $$;
