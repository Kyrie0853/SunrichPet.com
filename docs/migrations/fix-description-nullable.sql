-- ============================================================
-- 紧急修复：发布商品报错
-- "null value in column "description" of relation "studio_products"
--  violates not-null constraint"
--
-- 根因：商品表单简化后，前端在 description 为空时传入了显式 NULL，
--       而 studio_products.description 列有 NOT NULL 约束。
--       显式 NULL 会绕过列默认值（DEFAULT ''），从而触发约束报错。
--
-- 方案 A：放宽数据库约束（推荐，作为兜底防御）
--  1) 移除 NOT NULL 约束，允许 description 为空
--  2) 设置默认值为空字符串（省略该列时自动填充 ''）
--
-- 说明：代码层面已同步修复（前端不再传 null，后端自动兜底补空字符串），
--       本脚本为数据库侧的额外保险。请在 Supabase SQL Editor 中执行。
-- ============================================================

ALTER TABLE public.studio_products ALTER COLUMN description DROP NOT NULL;
ALTER TABLE public.studio_products ALTER COLUMN description SET DEFAULT '';

-- 可选：将历史遗留的 NULL 值统一刷成空字符串，保持数据整洁
UPDATE public.studio_products SET description = '' WHERE description IS NULL;
