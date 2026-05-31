-- ============================================
-- P0 全站 Bug 清零 — 数据库修复脚本
-- 执行方式：在 Supabase SQL Editor 中完整执行
-- 所有操作均为幂等（可重复执行不报错）
-- ============================================

-- ============================================
-- Step 1: 私信系统 v2 — conversations + messages
-- ============================================

-- 1.1 创建 conversations 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 唯一索引（防止重复会话）
CREATE UNIQUE INDEX IF NOT EXISTS conv_unique_pair_idx 
  ON public.conversations (LEAST(participant_1,participant_2), GREATEST(participant_1,participant_2));
CREATE INDEX IF NOT EXISTS conv_p1_idx ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS conv_p2_idx ON public.conversations(participant_2);

-- 1.3 检查 messages 表是否有 conversation_id 列
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'conversation_id'
  ) THEN
    -- 如果 messages 表存在但是 v1 格式（sender_id/receiver_id），需要迁移
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
    
    -- 为现有消息创建会话并关联
    INSERT INTO public.conversations (participant_1, participant_2)
    SELECT DISTINCT LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
    FROM public.messages
    WHERE conversation_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.participant_1 = LEAST(messages.sender_id, messages.receiver_id)
          AND c.participant_2 = GREATEST(messages.sender_id, messages.receiver_id)
      );
    
    -- 更新现有消息的 conversation_id
    UPDATE public.messages m
    SET conversation_id = c.id
    FROM public.conversations c
    WHERE c.participant_1 = LEAST(m.sender_id, m.receiver_id)
      AND c.participant_2 = GREATEST(m.sender_id, m.receiver_id)
      AND m.conversation_id IS NULL;
  END IF;
END $$;

-- 1.4 重建 messages 索引（适配 v2）
CREATE INDEX IF NOT EXISTS msg_conv_time_idx ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS msg_unread_idx ON public.messages(sender_id, conversation_id, is_read) WHERE is_read = false;

-- 1.5 启用 RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1.6 删除旧策略（幂等）
DROP POLICY IF EXISTS rls_conv_select ON public.conversations;
DROP POLICY IF EXISTS rls_conv_insert ON public.conversations;
DROP POLICY IF EXISTS rls_msg_select ON public.messages;
DROP POLICY IF EXISTS rls_msg_insert ON public.messages;
DROP POLICY IF EXISTS rls_msg_update ON public.messages;

-- 1.7 创建新 RLS 策略

-- conversations: 参与者可读
CREATE POLICY rls_conv_select ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- conversations: 参与者可创建
CREATE POLICY rls_conv_insert ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- messages: 会话参与者可读
CREATE POLICY rls_msg_select ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- messages: 发送者可在自己参与的会话中插入
CREATE POLICY rls_msg_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- messages: 会话参与者可更新（标记已读等）
CREATE POLICY rls_msg_update ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- 1.8 触发器：自动更新 conversation.updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_msg_update_conv ON public.messages;
CREATE TRIGGER trg_msg_update_conv
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();


-- ============================================
-- Step 2: 自动创建 profiles（修复头像点击 404）
-- 当用户注册时，自动创建 profiles 记录
-- ============================================

-- 2.1 触发器函数：新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2.2 删除旧触发器（如果存在）并重新创建
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2.3 为现有用户补充缺失的 profiles（幂等）
INSERT INTO public.profiles (id, display_name, created_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- Step 3: 补充缺失索引
-- ============================================

-- profiles 查询优化
CREATE INDEX IF NOT EXISTS profiles_display_name_idx ON public.profiles(display_name);

-- 商品搜索优化
CREATE INDEX IF NOT EXISTS products_name_idx ON public.products USING gin (name gin_trgm_ops);
-- 注：如果 gin_trgm_ops 不可用，跳过此索引（ilike 仍可用但无索引加速）

-- community_posts 搜索优化  
CREATE INDEX IF NOT EXISTS community_posts_title_idx ON public.community_posts USING gin (title gin_trgm_ops);
-- 注：同上，如果扩展不可用则跳过


-- ============================================
-- 验证：输出当前状态
-- ============================================
DO $$ 
DECLARE
  conv_count INTEGER;
  msg_count INTEGER;
  profile_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT count(*) INTO conv_count FROM public.conversations;
  SELECT count(*) INTO msg_count FROM public.messages;
  SELECT count(*) INTO profile_count FROM public.profiles;
  SELECT count(*) INTO user_count FROM auth.users;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ P0 数据库修复完成';
  RAISE NOTICE '   conversations: % 条', conv_count;
  RAISE NOTICE '   messages: % 条', msg_count;
  RAISE NOTICE '   profiles: % 条（auth.users: % 条）', profile_count, user_count;
  IF profile_count < user_count THEN
    RAISE NOTICE '   ⚠️  有 % 个用户缺失 profiles（已尝试补充）', user_count - profile_count;
  END IF;
  RAISE NOTICE '========================================';
END $$;
