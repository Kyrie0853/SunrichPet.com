-- ============================================================
-- 平台合规与信任体系 — 数据库迁移
-- 执行: Supabase SQL Editor 粘贴全部执行
-- ============================================================

-- 1. blocked_keywords
CREATE TABLE IF NOT EXISTS public.blocked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('contact', 'animal', 'illegal')),
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "所有人可读关键词" ON public.blocked_keywords FOR SELECT USING (true);
CREATE POLICY "管理员可管理关键词" ON public.blocked_keywords FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
);
INSERT INTO public.blocked_keywords (keyword, category, severity) VALUES
  ('微信','contact',1),('QQ','contact',1),('微信号','contact',1),('手机号','contact',1),
  ('电话','contact',1),('加我','contact',1),('私聊','contact',1),('扫码','contact',1),
  ('加V','contact',1),('VX','contact',1),('vx','contact',1),
  ('陆龟','animal',3),('缅甸陆龟','animal',3),('辐射陆龟','animal',3),
  ('安哥洛卡','animal',3),('蟒蛇','animal',3),('球蟒','animal',3),
  ('缅甸蟒','animal',3),('网纹蟒','animal',3),('绿水蚺','animal',3),
  ('巨蜥','animal',3),('科莫多','animal',3),('鳄鱼','animal',3),
  ('玳瑁','animal',3),('鹦鹉','animal',3),('苏卡达','animal',3),
  ('豹龟','animal',3),('赫曼','animal',3),('星龟','animal',3),
  ('凹甲','animal',3),('四爪','animal',3),
  ('线下交易','illegal',2),('面交','illegal',2),('私下','illegal',2),
  ('直接转账','illegal',2),('不走平台','illegal',2),('私下交易','illegal',2),
  ('现金交易','illegal',2),('微信支付','illegal',2),('支付宝转账','illegal',2)
ON CONFLICT (keyword) DO NOTHING;


-- 2. violation_logs
CREATE TABLE IF NOT EXISTS public.violation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL CHECK (violation_type IN ('keyword_block', 'rule_violation')),
  matched_keyword TEXT,
  content TEXT CHECK (char_length(content) <= 200),
  action_taken TEXT NOT NULL CHECK (action_taken IN ('warned', 'muted', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.violation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "管理员可管理违规日志" ON public.violation_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
);
CREATE POLICY "用户可查看自己的违规日志" ON public.violation_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "禁止删除违规日志" ON public.violation_logs FOR DELETE USING (false);
CREATE INDEX IF NOT EXISTS idx_violation_logs_user_id ON public.violation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_violation_logs_created_at ON public.violation_logs(created_at);

-- 3. user_penalties
CREATE TABLE IF NOT EXISTS public.user_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  penalty_type TEXT NOT NULL CHECK (penalty_type IN ('warn', 'mute', 'ban')),
  reason TEXT NOT NULL,
  duration INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_penalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "管理员可管理处罚" ON public.user_penalties FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
);
CREATE POLICY "用户可查看自己的处罚" ON public.user_penalties FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_penalties_user_id ON public.user_penalties(user_id);

-- 4. user_agreements
CREATE TABLE IF NOT EXISTS public.user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('terms', 'privacy', 'posting_rules', 'seller_commitment_1', 'seller_commitment_2', 'trade_rules')),
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "管理员可读协议记录" ON public.user_agreements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
);
CREATE POLICY "用户可查看自己的协议记录" ON public.user_agreements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "禁止删除协议记录" ON public.user_agreements FOR DELETE USING (false);
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_id ON public.user_agreements(user_id);


-- 5. profiles 扩展
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_verified BOOLEAN DEFAULT false;

-- 6. bars 表修复 - 确保4个社区存在
-- 兼容旧表：如果 bars 表已存在，补充缺失列
CREATE TABLE IF NOT EXISTS public.bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '🐾',
  rules TEXT,
  is_active BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 补充可能缺失的列（旧表无 rules 列时）
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🐾';
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;

-- 启用 RLS（如果尚未启用）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bars' AND rowsecurity = true) THEN
    ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 创建 RLS 策略（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '所有人可读社区' AND tablename = 'bars') THEN
    CREATE POLICY "所有人可读社区" ON public.bars FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '管理员可管理社区' AND tablename = 'bars') THEN
    CREATE POLICY "管理员可管理社区" ON public.bars FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
    );
  END IF;
END $$;

INSERT INTO public.bars (name, slug, description, icon, rules) VALUES
  ('守宫爬宠区', 'gecko', '守宫、蜥蜴类爬宠饲养交流，分享你的爬宠日常', '🦎', '本区交流守宫饲养经验，禁止留联系方式、禁止买卖保护动物。'),
  ('龟类区', 'turtle', '水龟、陆龟、半水龟饲养经验交流，但禁止交易保护动物', '🐢', '本区交流龟类饲养经验，禁止留联系方式、禁止买卖保护动物。'),
  ('观赏鱼水区', 'aquarium', '观赏鱼、水草、虾螺养殖交流，打造你的水世界', '🐠', '本区交流观赏鱼饲养经验，禁止留联系方式、禁止买卖保护动物。'),
  ('新手交流避雷区', 'newbie', '新人报道、避坑指南、新手问答，老玩家帮你少走弯路', '💡', '欢迎新人！请先阅读平台规则，友好交流，禁止留联系方式。')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  rules = EXCLUDED.rules,
  is_active = true;

-- 清理多余社区：禁用不在4个社区中的旧吧
UPDATE public.bars SET is_active = false WHERE slug NOT IN ('gecko', 'turtle', 'aquarium', 'newbie');

-- 7. announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
INSERT INTO public.announcements (content, severity, sort_order)
SELECT '⚠️ 平台严禁私下交易、禁止买卖保护动物。所有交易必须通过平台担保完成。违规者将永久封号。', 'critical', 0
WHERE NOT EXISTS (SELECT 1 FROM public.announcements WHERE severity='critical' AND sort_order=0);

-- 8. seller_scores
CREATE TABLE IF NOT EXISTS public.seller_scores (
  seller_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 100 CHECK (score BETWEEN 0 AND 100),
  violation_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_scores ENABLE ROW LEVEL SECURITY;

-- 9. refund_requests
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  refund_amount NUMERIC(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- 10. seller_applications
CREATE TABLE IF NOT EXISTS public.seller_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  real_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',
  province TEXT,
  city TEXT,
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  business_license_url TEXT,
  health_cert_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reject_reason TEXT,
  commitment_1_agreed BOOLEAN DEFAULT false,
  commitment_2_agreed BOOLEAN DEFAULT false,
  commitment_agreed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- 11. orders 扩展
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_company TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS inspection_deadline TIMESTAMPTZ;

-- 12. products 活体扩展
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS species TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_weight TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS age_info TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_regions TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS live_arrival_policy TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS defect_notes TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_live_pet BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS parent_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- 13. reports 扩展
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS report_reason TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN RAISE NOTICE 'Platform compliance migration complete!'; END $$;
