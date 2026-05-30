# CONTEXT.md — 顺瑞益宠 (SunrichPet) 项目状态摘要

> **用途**: 新对话开始时，CC 读取此文件 + CLAUDE.md 即可快速恢复上下文。
> **更新频率**: 每完成一个功能模块后更新。

---

## 项目概述

**顺瑞益宠 (SunrichPet)** — 宠物玩家社区 + 商城综合平台。

- 域名: `sunrich-pet.top` (Cloudflare DNS → Vercel)
- 定位: 小众宠物（守宫、蛇、龟、观赏鱼等）爱好者交流 + 交易平台
- 当前阶段: 社区+商城整合阶段 (从 CLAUDE.md 阶段1 MVP 演进为综合平台)

## 技术栈

| 层级 | 技术 | 备注 |
|------|------|------|
| 全栈框架 | Next.js 16 (App Router) + Turbopack | |
| 语言 | TypeScript | |
| 样式 | Tailwind CSS 4 | |
| 数据库 | Supabase (PostgreSQL) | 项目 ID: `xokzjaaahbctzgelhiap` |
| 认证 | Supabase Auth (密码 + OTP 验证码) | OTP 已启用, mailer_autoconfirm=true |
| 存储 | Supabase Storage | Bucket: `community-images` |
| 支付 | Stripe (已集成) | 支付宝/微信/银行卡 |
| 部署 | Vercel (GitHub 自动部署) | |
| DNS | Cloudflare | CNAME → cname.vercel-dns.com |
| 测试 | Playwright (E2E) | |
| 动画 | Framer Motion | 启动动画 |

## 分支策略

```
main                    ← 生产环境 (Vercel 自动部署)
  └── dev/v2-platform   ← 集成分支 (所有功能在此汇集)
        ├── feat/splash-animation
        ├── feat/community-core
        └── feat/xxx...
```

操作流程: `feat/xxx → dev/v2-platform → main`

> ⚠️ 合并到 main 前确保 Supabase SQL 已执行！

---

## 已完成功能清单

### 品牌与导航
- [x] 品牌启动动画 (SplashScreen, sessionStorage 记忆)
- [x] 导航栏: 论坛/商城入口 + 搜索框 + 用户下拉菜单
- [x] 移动端底部导航栏 (MobileNav, 5 个 Tab)
- [x] 移动端响应式适配 (safe-area, 16px input, 44px touch)

### 用户认证
- [x] 邮箱密码登录 + 注册
- [x] 邮箱验证码 (OTP) 无密码登录
- [x] OTP 登录后设置密码
- [x] 忘记密码 (OTP 验证 → 设置新密码)
- [x] 全站中文错误提示 (translateError 函数)
- [x] 个人资料编辑 (头像/昵称/签名, /profile/edit)
- [x] 头像上传 (Supabase Storage, 2MB限制, 类型校验)

### 论坛社区
- [x] 论坛首页: 帖子列表 + 父分类Tab (全部/精华/爬宠/水族) + 子标签云 + 排序
- [x] 发帖: 标题/内容/分类/标签/图片上传 (XSS防护)
- [x] 帖子详情: 完整内容/图片/点赞/收藏/分享/评论 (嵌套回复)
- [x] 帖子编辑与删除 (仅作者)
- [x] 管理员置顶/加精 (PostDetail 操作按钮)
- [x] 举报系统 (ReportButton + /admin/reports 管理)
- [x] 全站搜索 (/search?q=xxx, 帖子+商品双Tab)

### 用户系统
- [x] 个人中心: 个人信息 + 等级徽章 + 积分
- [x] 关注/取关 (PostDetail + UserProfile)
- [x] 我的关注 / 我的粉丝 标签页
- [x] 动态流 (/feed, 关注者帖子)
- [x] 用户等级与积分 (发帖+5/评论+2/获赞+1/签到+3/加精+20)
- [x] 每日签到 (RPC daily_check_in)
- [x] 积分变动日志 (points_log 表)

### 私信聊天
- [x] conversations 表 (participant_1/participant_2)
- [x] messages 表 (conversation_id/sender_id/content/is_read)
- [x] 会话列表 (/messages)
- [x] 一对一聊天 (/messages/[userId])
- [x] Supabase Realtime 实时推送
- [x] 未读消息红点 (Navbar + UserMenu)

### 通知系统
- [x] notifications 表 (comment/reply/follow/like 类型)
- [x] 4 个 PG 触发器自动生成通知
- [x] 通知列表页 (/community/notifications)
- [x] 导航栏未读红点

### 商城
- [x] 商品列表 + 分类浏览 (/shop)
- [x] 商品详情页 (/products/[slug])
- [x] 购物车 (cart + cart_items)
- [x] 结算下单 (/checkout)
- [x] 商家评价系统 (seller_reviews 表, ⭐评分)
- [x] 商家主页 (/shop/seller/[id])
- [x] 订单管理 (/admin/orders)

### 支付
- [x] Stripe Checkout Session (支付宝/微信/银行卡)
- [x] Webhook 回调 (checkout.session.completed)
- [x] 订单状态流转 (pending→paid→shipped→completed/cancelled)

### 测试
- [x] Playwright E2E 测试 (31/31 通过)
- [x] 6 个测试模块: auth/forum/shop/social/security/mobile

---

## 数据库表清单

| 表 | 用途 | 关键字段 |
|----|------|----------|
| profiles | 用户资料 | display_name, avatar_url, bio, points, level, role |
| categories | 商品分类 | name, slug |
| products | 商品 | seller_id, name, price, stock, status |
| carts / cart_items | 购物车 | user_id, product_id, quantity |
| orders / order_items | 订单 | user_id, status, total_amount, stripe_session_id |
| community_posts | 论坛帖子 | author_id, title, content, is_pinned, is_featured |
| community_comments | 评论 | post_id, author_id, parent_id |
| community_likes | 点赞 | user_id, post_id / comment_id |
| community_favorites | 收藏 | user_id, post_id (私有RLS) |
| user_follows | 关注 | follower_id, following_id |
| community_tags | 标签 | name, slug, color, parent_id |
| community_post_tags | 帖子标签 | post_id, tag_id |
| notifications | 通知 | user_id, type, actor_id, is_read |
| conversations | 私信会话 | participant_1, participant_2 |
| messages | 私信消息 | conversation_id, sender_id, content, is_read |
| reports | 举报 | reporter_id, target_type, target_id, status |
| seller_reviews | 商家评价 | buyer_id, seller_id, rating (UNIQUE) |
| points_log | 积分日志 | user_id, action, points |

---

## 关键路由

| 路由 | 功能 | 鉴权 |
|------|------|:---:|
| `/` | 论坛首页 | 公开 |
| `/shop` | 商城 | 公开 |
| `/community` | 论坛 (同 /) | 公开 |
| `/community/new` | 发帖 | 登录 |
| `/community/post/[id]` | 帖子详情 | 公开 |
| `/community/post/[id]/edit` | 编辑帖子 | 作者 |
| `/community/user/[id]` | 用户主页 | 公开 |
| `/community/notifications` | 通知 | 登录 |
| `/feed` | 动态流 | 登录 |
| `/search` | 全站搜索 | 公开 |
| `/messages` | 会话列表 | 登录 |
| `/messages/[userId]` | 聊天 | 登录 |
| `/auth` | 登录/注册 | 公开 |
| `/profile/edit` | 编辑资料 | 登录 |
| `/cart` | 购物车 | 登录 |
| `/checkout` | 结算 | 登录 |
| `/products/[slug]` | 商品详情 | 公开 |
| `/shop/seller/[id]` | 商家主页 | 公开 |
| `/admin` | 后台管理 | admin |
| `/admin/reports` | 举报管理 | admin |
| `/admin/orders` | 订单管理 | admin |

---

## Supabase 配置摘要

- 项目 ID: `xokzjaaahbctzgelhiap`
- OTP 已启用 (`external_email_enabled: true`)
- 自动确认邮箱 (`mailer_autoconfirm: true`)
- 允许注册 (`disable_signup: false`)
- 邮件模板已汉化 (6 个模板)
- Storage Bucket: `community-images` (Public, RLS 已配置)
- 环境变量: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 关键配置

- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Vercel 环境变量需配置以上所有 key

---

## 安全原则 (来源: CLAUDE.md)

1. **所有表启用 RLS** — 收藏表私有, 其余公开读/作者写
2. **XSS 防护** — React 默认转义 + sanitize-html (备用)
3. **文件上传限制** — 类型(jpg/png/webp/gif), 大小(≤5MB/≤2MB头像), 数量(≤5张)
4. **前后端双重权限校验** — 前端按钮显隐 + RLS 策略
5. **全站 HTTPS** (Vercel 默认)
6. **密钥存环境变量** — 无硬编码

---

## 后续使用规则

1. 新对话中先让 CC 读取 `docs/CONTEXT.md` 和 `CLAUDE.md`
2. 每完成一个功能后更新此文件
3. 部署前确认 Supabase SQL 已执行
4. 所有 SQL 迁移文件在 `docs/` 目录下

---

*最后更新: 2026-05-30 — 全功能集成阶段*
