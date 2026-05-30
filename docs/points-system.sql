-- 用户等级与积分系统

-- 1. profiles 扩展
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS check_in_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS check_in_streak INTEGER NOT NULL DEFAULT 0;

-- 2. 积分变动日志
CREATE TABLE IF NOT EXISTS public.points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS points_log_user_idx ON public.points_log(user_id,created_at DESC);
ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_pl_read ON public.points_log FOR SELECT TO authenticated USING (auth.uid()=user_id);

-- 3. 等级计算函数
CREATE OR REPLACE FUNCTION public.calc_level(p INTEGER) RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p>=2000 THEN 6 WHEN p>=1000 THEN 5 WHEN p>=600 THEN 4 WHEN p>=300 THEN 3 WHEN p>=100 THEN 2 ELSE 1 END;
$$;

-- 4. 积分变动函数
CREATE OR REPLACE FUNCTION public.add_points(uid UUID, pts INTEGER, act TEXT, descr TEXT DEFAULT NULL) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  UPDATE public.profiles SET points=points+pts, level=public.calc_level(points+pts) WHERE id=uid;
  INSERT INTO public.points_log(user_id,action,points,description) VALUES(uid,act,pts,COALESCE(descr,act));
END;
$$;

-- 5. 触发器：发帖 +5
CREATE OR REPLACE FUNCTION public.trg_post_points() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN PERFORM public.add_points(NEW.author_id,5,'发帖','发布帖子：'||NEW.title); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_post_points ON public.community_posts;
CREATE TRIGGER trg_post_points AFTER INSERT ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.trg_post_points();

-- 6. 触发器：评论 +2
CREATE OR REPLACE FUNCTION public.trg_comment_points() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN PERFORM public.add_points(NEW.author_id,2,'评论'); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_comment_points ON public.community_comments;
CREATE TRIGGER trg_comment_points AFTER INSERT ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.trg_comment_points();

-- 7. 触发器：被点赞 +1（给帖主）
CREATE OR REPLACE FUNCTION public.trg_like_points() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE pa UUID;
BEGIN IF NEW.post_id IS NOT NULL THEN SELECT author_id INTO pa FROM public.community_posts WHERE id=NEW.post_id; IF pa IS NOT NULL AND pa<>NEW.user_id THEN PERFORM public.add_points(pa,1,'获赞'); END IF; END IF; RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_like_points ON public.community_likes;
CREATE TRIGGER trg_like_points AFTER INSERT ON public.community_likes FOR EACH ROW EXECUTE FUNCTION public.trg_like_points();

-- 8. 签到函数（前端调用 RPC）
CREATE OR REPLACE FUNCTION public.daily_check_in() RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u RECORD; streak INTEGER; pts INTEGER;
BEGIN
  SELECT check_in_date,check_in_streak INTO u FROM public.profiles WHERE id=auth.uid();
  IF u.check_in_date=CURRENT_DATE THEN RETURN json_build_object('error','今日已签到'); END IF;
  IF u.check_in_date=CURRENT_DATE-INTERVAL '1 day' THEN streak:=u.check_in_streak+1; ELSE streak:=1; END IF;
  pts:=3;
  UPDATE public.profiles SET check_in_date=CURRENT_DATE,check_in_streak=streak,points=points+pts,level=public.calc_level(points+pts) WHERE id=auth.uid();
  INSERT INTO public.points_log(user_id,action,points,description) VALUES(auth.uid(),'签到',pts,'连续签到 '||streak||' 天');
  RETURN json_build_object('success',true,'points',pts,'streak',streak);
END;
$$;