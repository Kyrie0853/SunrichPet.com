-- ============================================
-- 私信系统 v2 — conversations + messages
-- ============================================

-- 1. 会话表
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

);
CREATE UNIQUE INDEX IF NOT EXISTS conv_unique_pair_idx ON public.conversations (LEAST(participant_1,participant_2), GREATEST(participant_1,participant_2));
CREATE INDEX IF NOT EXISTS conv_p1_idx ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS conv_p2_idx ON public.conversations(participant_2);

-- 2. 消息表（新增 conversation_id）
DROP TABLE IF EXISTS public.messages CASCADE;
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS msg_conv_idx ON public.messages(conversation_id,created_at ASC);
CREATE INDEX IF NOT EXISTS msg_unread_idx ON public.messages(sender_id,conversation_id,is_read) WHERE is_read=false;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS: conversations — 参与者可读
CREATE POLICY rls_conv_select ON public.conversations FOR SELECT TO authenticated USING (auth.uid()=participant_1 OR auth.uid()=participant_2);
CREATE POLICY rls_conv_insert ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid()=participant_1 OR auth.uid()=participant_2);

-- RLS: messages — 会话参与者可读写
CREATE POLICY rls_msg_select ON public.messages FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.conversations WHERE conversations.id=messages.conversation_id AND (conversations.participant_1=auth.uid() OR conversations.participant_2=auth.uid())));
CREATE POLICY rls_msg_insert ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid()=sender_id AND EXISTS(SELECT 1 FROM public.conversations WHERE conversations.id=messages.conversation_id AND (conversations.participant_1=auth.uid() OR conversations.participant_2=auth.uid())));
CREATE POLICY rls_msg_update ON public.messages FOR UPDATE TO authenticated USING (EXISTS(SELECT 1 FROM public.conversations WHERE conversations.id=messages.conversation_id AND (conversations.participant_1=auth.uid() OR conversations.participant_2=auth.uid())));

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp() RETURNS TRIGGER LANGUAGE plpgsql AS 
$$ BEGIN UPDATE public.conversations SET updated_at=now() WHERE id=NEW.conversation_id; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_msg_update_conv ON public.messages;
CREATE TRIGGER trg_msg_update_conv AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();