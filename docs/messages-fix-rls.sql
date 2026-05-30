-- ============================================
-- 私信 RLS 策略修复（可重复执行，幂等）
-- 如果私信仍不可用，请在 Supabase SQL Editor 执行此文件
-- ============================================

-- 确认 conversations 表存在
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    CREATE TABLE IF NOT EXISTS public.conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- 唯一索引（防止重复会话）
    CREATE UNIQUE INDEX IF NOT EXISTS conv_unique_pair_idx 
      ON public.conversations (LEAST(participant_1,participant_2), GREATEST(participant_1,participant_2));
    CREATE INDEX IF NOT EXISTS conv_p1_idx ON public.conversations(participant_1);
    CREATE INDEX IF NOT EXISTS conv_p2_idx ON public.conversations(participant_2);
  END IF;
END $$;

-- 确认 messages 表有 conversation_id 列
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'conversation_id') THEN
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 重建索引
CREATE INDEX IF NOT EXISTS msg_conv_time_idx ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS msg_unread_idx ON public.messages(sender_id, conversation_id, is_read) WHERE is_read = false;

-- 启用 RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（可能来自 v1）
DROP POLICY IF EXISTS rls_conv_select ON public.conversations;
DROP POLICY IF EXISTS rls_conv_insert ON public.conversations;
DROP POLICY IF EXISTS rls_msg_select ON public.messages;
DROP POLICY IF EXISTS rls_msg_insert ON public.messages;
DROP POLICY IF EXISTS rls_msg_update ON public.messages;

-- 会话策略
CREATE POLICY rls_conv_select ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY rls_conv_insert ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- 消息策略
CREATE POLICY rls_msg_select ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

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

CREATE POLICY rls_msg_update ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- 触发器：自动更新 conversation.updated_at
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

-- 验证：检查当前用户能否查询会话
DO $$ 
DECLARE
  conv_count INTEGER;
  msg_count INTEGER;
BEGIN
  SELECT count(*) INTO conv_count FROM public.conversations;
  SELECT count(*) INTO msg_count FROM public.messages;
  RAISE NOTICE '✅ 私信 RLS 修复完成 — conversations: %, messages: %', conv_count, msg_count;
END $$;
