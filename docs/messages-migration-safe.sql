-- ============================================
-- 私信系统安全迁移 — v1 → v2（不丢失数据）
-- 执行前请确认当前表结构，然后逐步执行
-- ============================================

-- Step 1: 创建 conversations 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: 唯一约束（防重复会话，如果不存在则创建）
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'conv_unique_pair_idx') THEN
    CREATE UNIQUE INDEX conv_unique_pair_idx ON public.conversations (LEAST(participant_1,participant_2), GREATEST(participant_1,participant_2));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS conv_p1_idx ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS conv_p2_idx ON public.conversations(participant_2);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Step 3: 检查 messages 表是否有 conversation_id 列
-- 如果没有（v1 schema），则添加迁移
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'conversation_id'
  ) THEN
    -- v1 → v2 迁移：添加 conversation_id 列
    ALTER TABLE public.messages ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
    
    -- 为现有消息创建会话并关联（基于 sender_id/receiver_id 对）
    INSERT INTO public.conversations (participant_1, participant_2)
    SELECT DISTINCT LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
    FROM public.messages
    WHERE NOT EXISTS (
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

-- Step 4: 重建索引（适配 v2 schema）
CREATE INDEX IF NOT EXISTS msg_conv_time_idx ON public.messages(conversation_id, created_at ASC);
DROP INDEX IF EXISTS msg_conv_idx;
CREATE INDEX IF NOT EXISTS msg_unread_idx ON public.messages(sender_id, conversation_id, is_read) WHERE is_read = false;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS 策略（先删除旧的，再创建新的）
DROP POLICY IF EXISTS rls_conv_select ON public.conversations;
DROP POLICY IF EXISTS rls_conv_insert ON public.conversations;
DROP POLICY IF EXISTS rls_msg_select ON public.messages;
DROP POLICY IF EXISTS rls_msg_insert ON public.messages;
DROP POLICY IF EXISTS rls_msg_update ON public.messages;

-- conversations: 参与者可读可创建
CREATE POLICY rls_conv_select ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY rls_conv_insert ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- messages: 会话参与者可读写
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

-- Step 6: 创建触发器（自动更新 conversation.updated_at）
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

-- 完成
DO $$ BEGIN RAISE NOTICE '✅ 私信系统迁移完成'; END $$;
