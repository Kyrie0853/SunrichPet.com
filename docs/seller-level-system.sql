-- ============================================================
-- 商家体系增强 + 用户等级与激励体系
-- 在 Supabase SQL Editor 中全选粘贴执行
-- ============================================================

-- 1. 等级配置表
CREATE TABLE IF NOT EXISTS public.level_config (
  level INTEGER PRIMARY KEY, name TEXT NOT NULL,
  xp_required INTEGER NOT NULL, icon TEXT NOT NULL, color TEXT NOT NULL
);
INSERT INTO public.level_config VALUES
  (1,'初来乍到',0,'🌱','#9ca3af'),(2,'见习玩家',50,'🌿','#6b7280'),
  (3,'活跃宠友',150,'🦎','#1a7f5a'),(4,'资深玩家',400,'🐢','#166b4b'),
  (5,'宠物达人',1000,'🐍','#0d9488'),(6,'爬宠专家',2500,'🦖','#0891b2'),
  (7,'传奇大师',6000,'👑','#7c3aed')
ON CONFLICT (level) DO UPDATE SET name=EXCLUDED.name;

-- 2. 勋章定义表
CREATE TABLE IF NOT EXISTS public.medal_defs (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
  icon TEXT NOT NULL, condition_type TEXT NOT NULL, condition_value INTEGER DEFAULT 1
);
INSERT INTO public.medal_defs VALUES
  ('first_post','初次发声','发布第一篇帖子','📝','post_count',1),
  ('popular','人气之星','获得100个点赞','⭐','like_received',100),
  ('helper','热心玩家','发表50条评论','💬','comment_count',50),
  ('first_trade','首笔交易','完成第一笔交易','🤝','trade_count',1),
  ('checkin_master','签到达人','连续签到30天','🔥','checkin_streak',30),
  ('featured_author','精华作者','帖子被加精5次','🏆','featured_count',5),
  ('reptile_expert','爬宠专家','达到Lv6等级','🦖','level',6)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;

-- 3. 用户勋章表
CREATE TABLE IF NOT EXISTS public.user_medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medal_id TEXT NOT NULL REFERENCES public.medal_defs(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, medal_id)
);
ALTER TABLE public.user_medals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_read_medals" ON public.user_medals FOR SELECT USING (true);

-- 4. profiles 扩展字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medals TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trade_count INTEGER DEFAULT 0;

-- 5. seller_applications 扩展
ALTER TABLE public.seller_applications ADD COLUMN IF NOT EXISTS resubmitted BOOLEAN DEFAULT false;

-- 6. 经验值触发器：发帖 +5 XP
CREATE OR REPLACE FUNCTION public.award_xp_post()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET xp = xp + 5 WHERE id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
DROP TRIGGER IF EXISTS trg_xp_post ON public.community_posts;
CREATE TRIGGER trg_xp_post AFTER INSERT ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.award_xp_post();

-- 评论 +2 XP
CREATE OR REPLACE FUNCTION public.award_xp_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET xp = xp + 2 WHERE id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
DROP TRIGGER IF EXISTS trg_xp_comment ON public.community_comments;
CREATE TRIGGER trg_xp_comment AFTER INSERT ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.award_xp_comment();

-- 被点赞 +1 XP（给帖主）
CREATE OR REPLACE FUNCTION public.award_xp_liked()
RETURNS TRIGGER AS $$
DECLARE pa UUID;
BEGIN
  SELECT author_id INTO pa FROM public.community_posts WHERE id = NEW.post_id;
  IF pa IS NOT NULL AND pa != NEW.user_id THEN
    UPDATE public.profiles SET xp = xp + 1 WHERE id = pa;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
DROP TRIGGER IF EXISTS trg_xp_liked ON public.community_likes;
CREATE TRIGGER trg_xp_liked AFTER INSERT ON public.community_likes FOR EACH ROW EXECUTE FUNCTION public.award_xp_liked();

-- 加精 +20 XP
CREATE OR REPLACE FUNCTION public.award_xp_featured()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_featured = true AND (OLD.is_featured IS NULL OR OLD.is_featured = false) THEN
    UPDATE public.profiles SET xp = xp + 20 WHERE id = NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
DROP TRIGGER IF EXISTS trg_xp_featured ON public.community_posts;
CREATE TRIGGER trg_xp_featured AFTER UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.award_xp_featured();

-- 7. 自动升级触发器
CREATE OR REPLACE FUNCTION public.check_level_up()
RETURNS TRIGGER AS $$
DECLARE nl INTEGER; ln TEXT;
BEGIN
  SELECT lc.level INTO nl FROM public.level_config lc WHERE lc.xp_required <= NEW.xp ORDER BY lc.level DESC LIMIT 1;
  IF nl IS NOT NULL AND nl != NEW.level THEN
    NEW.level := nl;
    SELECT name INTO ln FROM public.level_config WHERE level = nl;
    INSERT INTO public.notifications(user_id, type, target_type, details)
    VALUES (NEW.id, 'level_up', 'level', jsonb_build_object('level', nl, 'name', ln));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
DROP TRIGGER IF EXISTS trg_check_level_up ON public.profiles;
CREATE TRIGGER trg_check_level_up BEFORE UPDATE OF xp ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.check_level_up();

-- 8. 商家新订单通知
CREATE OR REPLACE FUNCTION public.notify_seller_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seller_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, actor_id, target_type, target_id)
    VALUES (NEW.seller_id, 'new_order', NEW.user_id, 'order', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
DROP TRIGGER IF EXISTS trg_notify_seller_order ON public.orders;
CREATE TRIGGER trg_notify_seller_order AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_seller_order();

-- 9. 商家评分扣分函数
-- 用法: SELECT deduct_seller_score('seller-uuid', 20, '发布违禁商品');
CREATE OR REPLACE FUNCTION public.deduct_seller_score(p_seller_id UUID, p_points INTEGER, p_reason TEXT)
RETURNS void AS $$
DECLARE vs INTEGER;
BEGIN
  INSERT INTO public.seller_scores(seller_id, score, violation_count) VALUES(p_seller_id, 100, 0) ON CONFLICT(seller_id) DO NOTHING;
  UPDATE public.seller_scores SET score = GREATEST(score - p_points, 0), violation_count = violation_count + 1, updated_at = now()
  WHERE seller_id = p_seller_id RETURNING score INTO vs;
  IF vs < 40 THEN
    UPDATE public.profiles SET seller_verified = false WHERE id = p_seller_id;
  END IF;
  INSERT INTO public.notifications(user_id, type, target_type, details)
  VALUES (p_seller_id, 'score_deduct', 'seller_score',
    jsonb_build_object('points', p_points, 'new_score', vs, 'reason', p_reason));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 10. 增强签到函数（替换原 daily_check_in）
CREATE OR REPLACE FUNCTION public.check_in()
RETURNS JSONB AS $$
DECLARE
  uid UUID := auth.uid();
  td DATE := CURRENT_DATE;
  yd DATE := CURRENT_DATE - 1;
  st INTEGER;
  bonus INTEGER := 0;
  xp INTEGER := 3;
  ld DATE;
BEGIN
  SELECT check_in_date, check_in_streak INTO ld, st FROM public.profiles WHERE id = uid;
  IF ld = td THEN RETURN jsonb_build_object('error', '今天已签到'); END IF;
  IF ld = yd THEN st := st + 1; ELSE st := 1; END IF;
  IF st % 7 = 0 THEN bonus := 10; END IF;
  IF st % 30 = 0 THEN bonus := bonus + 50; END IF;
  UPDATE public.profiles SET points = points + xp + bonus, check_in_date = td,
    check_in_streak = st, xp = xp + xp + bonus WHERE id = uid;
  RETURN jsonb_build_object('xp', xp + bonus, 'streak', st, 'bonus', bonus);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DO $$ BEGIN RAISE NOTICE 'Seller + Level system migration complete!'; END $$;
