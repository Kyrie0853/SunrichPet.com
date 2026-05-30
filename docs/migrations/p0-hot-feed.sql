-- ============================================
-- P0 热门广场 — 加权评分 + 时间衰减
-- ============================================

-- 索引优化：加速热门帖子查询
CREATE INDEX IF NOT EXISTS posts_hot_idx ON public.community_posts(created_at DESC, view_count DESC);
CREATE INDEX IF NOT EXISTS posts_bar_hot_idx ON public.community_posts(bar_id, created_at DESC) WHERE bar_id IS NOT NULL;

-- 热门帖子视图：综合权重 = 点赞×3 + 评论×2 + 浏览量×1 + 收藏×4
-- 时间衰减：7天内×2，7-30天×1，30天后×0.5
CREATE OR REPLACE VIEW public.hot_posts_view AS
SELECT 
  p.*,
  COALESCE(l.like_count, 0) AS like_count,
  COALESCE(c.comment_count, 0) AS comment_count,
  COALESCE(f.fav_count, 0) AS fav_count,
  (
    (COALESCE(l.like_count, 0) * 3 + COALESCE(c.comment_count, 0) * 2 + COALESCE(p.view_count, 0) * 1 + COALESCE(f.fav_count, 0) * 4) *
    CASE 
      WHEN p.created_at > NOW() - INTERVAL '7 days' THEN 2.0
      WHEN p.created_at > NOW() - INTERVAL '30 days' THEN 1.0
      ELSE 0.5
    END
  ) AS hot_score
FROM public.community_posts p
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS like_count FROM public.community_likes WHERE post_id = p.id
) l ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS comment_count FROM public.community_comments WHERE post_id = p.id
) c ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS fav_count FROM public.community_favorites WHERE post_id = p.id
) f ON true
ORDER BY 
  p.is_pinned DESC,
  hot_score DESC;

DO $$ BEGIN RAISE NOTICE '✅ 热门广场视图创建完成'; END $$;
