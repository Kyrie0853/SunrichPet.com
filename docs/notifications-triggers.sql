-- ============================================
-- 自动通知触发器函数
-- 请在 Supabase SQL Editor 中执行
-- ============================================

-- 评论帖子时通知帖主
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $
DECLARE
  post_author UUID;
BEGIN
  SELECT author_id INTO post_author FROM public.community_posts WHERE id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, post_id, comment_id)
    VALUES (post_author, 'comment', NEW.author_id, NEW.post_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS trg_notify_comment ON public.community_comments;
CREATE TRIGGER trg_notify_comment AFTER INSERT ON public.community_comments FOR EACH ROW WHEN (NEW.parent_id IS NULL) EXECUTE FUNCTION public.notify_post_comment();

-- 回复评论时通知被回复者
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $
DECLARE
  parent_author UUID;
BEGIN
  SELECT author_id INTO parent_author FROM public.community_comments WHERE id = NEW.parent_id;
  IF parent_author IS NOT NULL AND parent_author <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, post_id, comment_id)
    VALUES (parent_author, 'reply', NEW.author_id, NEW.post_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS trg_notify_reply ON public.community_comments;
CREATE TRIGGER trg_notify_reply AFTER INSERT ON public.community_comments FOR EACH ROW WHEN (NEW.parent_id IS NOT NULL) EXECUTE FUNCTION public.notify_comment_reply();

-- 关注时通知被关注者
CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $
BEGIN
  INSERT INTO public.notifications (user_id, type, actor_id)
  VALUES (NEW.following_id, 'follow', NEW.follower_id);
  RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS trg_notify_follow ON public.user_follows;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.user_follows FOR EACH ROW EXECUTE FUNCTION public.notify_follow();

-- 点赞帖子时通知帖主
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $
DECLARE
  post_author UUID;
BEGIN
  SELECT author_id INTO post_author FROM public.community_posts WHERE id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, post_id)
    VALUES (post_author, 'like', NEW.user_id, NEW.post_id);
  END IF;
  RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS trg_notify_like ON public.community_likes;
CREATE TRIGGER trg_notify_like AFTER INSERT ON public.community_likes FOR EACH ROW WHEN (NEW.post_id IS NOT NULL) EXECUTE FUNCTION public.notify_post_like();