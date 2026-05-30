-- 私信聊天系统
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS msg_conv_idx ON public.messages(LEAST(sender_id,receiver_id),GREATEST(sender_id,receiver_id),created_at DESC);
CREATE INDEX IF NOT EXISTS msg_unread_idx ON public.messages(receiver_id,is_read) WHERE is_read = false;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_msg_insert ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY rls_msg_select ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY rls_msg_update ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);