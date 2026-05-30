-- 举报系统
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','comment')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS reports_target_idx ON public.reports(target_type,target_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status) WHERE status='pending';

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_report_insert ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid()=reporter_id);
CREATE POLICY rls_report_select ON public.reports FOR SELECT TO authenticated USING (auth.uid()=reporter_id OR public.is_admin());
CREATE POLICY rls_report_update ON public.reports FOR UPDATE TO authenticated USING (public.is_admin());