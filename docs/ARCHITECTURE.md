# ARCHITECTURE.md — 宠物交易平台

## 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 全栈框架 | Next.js 16 (App Router) | SSR/SSG 支持、API Routes、Vercel 一键部署 |
| 语言 | TypeScript | 类型安全，减少运行时错误 |
| 样式 | Tailwind CSS 4 | 原子化 CSS，快速出 UI |
| 数据库 | Supabase (PostgreSQL) | 托管 PostgreSQL + Auth + Storage + RLS，零运维 |
| 认证 | Supabase Auth | 内置邮箱/密码认证，自动管理 session |
| 部署 | Vercel | 与 Next.js 同厂，自动 CI/CD |
| 支付 | 阶段2 集成 Stripe | 阶段1 仅模拟下单 |

---

## 数据库表结构（阶段1）

### 实体关系图（ERD）

```
auth.users ──1:1── profiles
     │
     ├──1:N── products (seller_id)
     │
     ├──1:1── carts
     │          └──1:N── cart_items ──N:1── products
     │
     └──1:N── orders
                └──1:N── order_items ──N:1── products
                         (快照 product_name/price)

categories ──1:N── products
```

### 1. profiles（用户资料）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK, FK → auth.users | 与 Supabase Auth 用户一一对应 |
| role | TEXT | NOT NULL, CHECK IN ('customer','admin') | 角色：customer（默认）/ admin |
| display_name | TEXT | nullable | 显示名称 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 创建时间 |

- 新用户注册时由 `handle_new_user()` 触发器自动创建，默认角色 `customer`
- **升级管理员**：需手动在 Supabase Dashboard → SQL Editor 执行：
  `UPDATE public.profiles SET role = 'admin' WHERE id = '用户UUID';`

### 2. categories（商品分类）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 主键 |
| name | TEXT | NOT NULL, UNIQUE | 分类名称（如"守宫"） |
| slug | TEXT | NOT NULL, UNIQUE | URL 友好标识 |
| description | TEXT | nullable | 分类描述 |
| image_url | TEXT | nullable | 分类封面图 |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | 排序权重 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 创建时间 |

### 3. products（商品）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| seller_id | UUID | FK → auth.users, ON DELETE SET NULL | 卖家 ID（阶段1指向管理员） |
| category_id | UUID | FK → categories, ON DELETE SET NULL | 所属分类 |
| name | TEXT | NOT NULL | 商品名称 |
| slug | TEXT | NOT NULL, UNIQUE | URL 友好标识 |
| description | TEXT | NOT NULL, DEFAULT '' | 商品描述 |
| price | NUMERIC(10,2) | NOT NULL, CHECK ≥ 0 | 价格 |
| stock | INTEGER | NOT NULL, DEFAULT 0, CHECK ≥ 0 | 库存数量 |
| image_url | TEXT | nullable | 主图 URL |
| images | TEXT[] | DEFAULT '{}' | 多图 URL 数组 |
| status | TEXT | NOT NULL, CHECK IN ('active','inactive') | active=上架 / inactive=下架 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 更新时间 |

### 4. carts（购物车）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| user_id | UUID | NOT NULL, UNIQUE, FK → auth.users | 用户 ID（一对一） |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 更新时间 |

### 5. cart_items（购物车明细）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| cart_id | UUID | NOT NULL, FK → carts, CASCADE | 所属购物车 |
| product_id | UUID | NOT NULL, FK → products, CASCADE | 商品 ID |
| quantity | INTEGER | NOT NULL, DEFAULT 1, CHECK > 0 | 数量 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 创建时间 |

- 联合唯一索引 `(cart_id, product_id)` 防止重复加入同一商品

### 6. orders（订单）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| user_id | UUID | NOT NULL, FK → auth.users | 下单用户 |
| status | TEXT | NOT NULL, CHECK IN ('pending','confirmed','cancelled') | 订单状态（阶段1默认 pending） |
| total_amount | NUMERIC(10,2) | NOT NULL, CHECK ≥ 0 | 订单总金额 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 下单时间 |

### 7. order_items（订单明细）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| order_id | UUID | NOT NULL, FK → orders, CASCADE | 所属订单 |
| product_id | UUID | FK → products, ON DELETE SET NULL | 商品 ID（商品删除后保留记录） |
| product_name | TEXT | NOT NULL | 下单时商品名称快照 |
| product_price | NUMERIC(10,2) | NOT NULL, CHECK ≥ 0 | 下单时商品单价快照 |
| quantity | INTEGER | NOT NULL, CHECK > 0 | 购买数量 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 创建时间 |

> `product_name` 和 `product_price` 采用快照而非 JOIN 查询，保证订单历史不受商品后续修改影响。

---

## RLS 权限矩阵

| 表 | 未登录 (anon) | 登录用户 (authenticated) | 管理员 (admin) |
|----|:---:|:---:|:---:|
| profiles | — | 读自己，更新自己 | 全部读写 |
| categories | 读 | 读 | 全部读写 |
| products | 读 (status=active) | 读 (status=active) | 全部读写 |
| carts | — | 读写自己的 | 读全部 |
| cart_items | — | 读写自己购物车的 | 读全部 |
| orders | — | 读自己 + 创建 | 全部读写 |
| order_items | — | 读自己订单的 + 创建 | 全部读写 |

### 关键安全设计说明

1. **匿名用户**只能读取 `categories` 和 `products`（仅 `status='active'` 的商品）
2. **登录用户**通过 `auth.uid()` 与表中的 `user_id` 比对，只能访问自己的数据
3. **管理员**通过 `public.is_admin()` 函数判断，该函数读取 `profiles` 中的 `role` 字段
4. `public.is_admin()` 使用 `SECURITY DEFINER` 模式，可绕过 profiles 表的 RLS 查询角色
5. 管理员通过 `profiles.role = 'admin'` 标识，需手动在 Supabase Dashboard 中设置
6. `cart_items` 和 `order_items` 通过子查询验证父表（carts/orders）的 `user_id`，防止越权

---

## API 设计（阶段1）

所有 API 通过 Next.js API Routes (`src/app/api/`) 或 Server Actions 实现：

| 端点/操作 | 方法 | 鉴权 | 说明 |
|-----------|------|------|------|
| 商品列表 | Server Component 直查 | — | 服务端渲染，无需 API |
| 商品详情 | Server Component 直查 | — | 动态路由 `[slug]` |
| 加入购物车 | Server Action | 需要登录 | 创建 cart + cart_item |
| 修改购物车数量 | Server Action | 需要登录 | 只能修改自己的 |
| 删除购物车项 | Server Action | 需要登录 | 只能删除自己的 |
| 模拟下单 | Server Action | 需要登录 | 清空购物车，创建订单 |
| 管理员增删改商品 | Server Action | admin | 后台专用 |
| 管理员增删改分类 | Server Action | admin | 后台专用 |

---

---
## 社区模块（Phase 2 — 宠物玩家社区）

### 新增表（8张 + 2张扩展）

| 表 | 说明 | 关键字段 | RLS |
|----|------|----------|-----|
| community_posts | 论坛帖子 | author_id, title, content, category, images[], is_pinned, view_count | 公开读/作者写/作者删 |
| community_comments | 评论（嵌套） | post_id, author_id, parent_id, content | 公开读/作者写/作者删 |
| community_likes | 点赞（多态） | user_id, post_id/comment_id（CHECK二选一） | 公开读/本人写/本人删 |
| community_favorites | 收藏 | user_id, post_id（UNIQUE） | **私有**读/本人写/本人删 |
| user_follows | 关注关系 | follower_id, following_id（CHECK防自关） | 公开读/本人写/本人删 |
| community_tags | 标签 | name, slug, color | 公开读/管理员管理 |
| community_post_tags | 帖子-标签 | post_id, tag_id（联合PK） | 公开读/作者管理/管理员管理 |
| notifications | 通知 | user_id, type(comment/reply/follow/like), actor_id, is_read | 本人读/本人更新（触发器SECURITY DEFINER绕过insert） |

profiles 扩展字段：`avatar_url`, `bio`, `updated_at`, `public_favorites`, `public_likes`, `allow_follows`

### 新增路由（18条总路由）

| 路由 | 功能 | 鉴权 |
|------|------|------|
| `/` | 论坛首页（社区主页） | 公开 |
| `/shop` | 商品商城（原首页） | 公开 |
| `/community` | 论坛首页（同 /） | 公开 |
| `/community/new` | 发帖（上传图片至 Storage） | 需登录 |
| `/community/post/[id]` | 帖子详情（内容/图片/点赞/收藏/分享/评论） | 公开 |
| `/community/post/[id]/edit` | 编辑帖子（仅作者） | 需登录+作者校验 |
| `/community/user/[id]` | 用户主页（三标签页：帖子/收藏/点赞） | 公开 |
| `/community/notifications` | 消息通知（列表+标记已读） | 需登录 |

### 组件清单

| 组件 | 类型 | 功能 |
|------|------|------|
| UserMenu | 客户端 | 导航栏用户下拉菜单（头像+昵称+未读红点） |
| PostCard | 客户端 | 帖子列表卡片 |
| PostList | 客户端 | 帖子列表（分类筛选+排序+分页） |
| PostDetail | 客户端 | 帖子详情（点赞/收藏/分享/编辑/删除按钮） |
| EditPostForm | 客户端 | 编辑帖子表单（预填+标签管理） |
| CommentSection | 客户端 | 评论区（发表+嵌套回复） |
| UserProfileTabs | 客户端 | 用户主页标签页（帖子/收藏/点赞） |
| NotificationList | 客户端 | 通知列表（已读/未读状态） |

### 数据库触发器（4个，自动通知）

| 触发器 | 触发时机 | 通知对象 |
|--------|----------|----------|
| trg_notify_comment | 新评论（parent_id IS NULL） | 帖主 |
| trg_notify_reply | 新回复（parent_id IS NOT NULL） | 被回复者 |
| trg_notify_follow | 新关注 | 被关注者 |
| trg_notify_like | 新点赞 | 帖主 |

> 所有触发器排除自操作（自己评论/点赞自己不会收到通知），使用 `SECURITY DEFINER SET search_path = ''` 安全模式。

### 安全措施

| 措施 | 实现方式 |
|------|----------|
| XSS 防护 | React JSX 默认转义 + sanitize-html（actions.ts 预置，备用） |
| 文件上传 | 类型（jpg/png/webp/gif）、大小（≤5MB）、数量（≤5张） |
| RLS | 8 张表全覆盖，收藏表为私有 |
| 输入校验 | CHECK 约束（标题2-200字/内容≥10字/评论≤5000字）+ 前端校验 |
| 权限检查 | 前端按钮显隐 + 服务端 RLS 双重校验（编辑/删除仅作者） |
| SQL 注入 | Supabase 参数化查询，无拼接 SQL |
| CSRF | Supabase Auth 自动处理 session token |

### 路由架构变更

```
/                     →  论坛首页（宠物玩家社区）
/shop                 →  商城（商品分类+搜索）
/community            →  论坛首页（同 /，兼容已有链接）
/community/new        →  发帖
/community/post/[id]  →  帖子详情
/community/post/[id]/edit → 编辑帖子
/community/user/[id]  →  用户主页
/community/notifications → 消息通知
/admin                →  商家后台（仅 role=admin）
```

### 部署前 SQL 执行清单

在 Supabase SQL Editor 中按顺序执行：
1. `docs/community-schema.sql` — 建表+RLS+标签种子数据+触发器
2. `docs/community-storage-setup.sql` — Storage RLS 策略
3. `docs/notifications-schema.sql` — 通知表+隐私字段+RLS
4. `docs/notifications-triggers.sql` — 自动通知触发器

另需在 Supabase Dashboard 手动创建 Storage Bucket：`community-images`（Public）

### 数据流

```
用户发帖 → 客户端上传图片至 Supabase Storage
         → supabase.from('community_posts').insert() → RLS 检查 auth.uid() = author_id
         → router.push 跳转详情页

他人评论 → PG 触发器 SECURITY DEFINER → INSERT notifications
         → Navbar 查询 notifications.is_read=false → 显示未读红点
         → 用户点击进入 /community/notifications → 自动标为已读
```

### RLS 权限矩阵

| 表 | 未登录 | 登录用户 | 作者 | 管理员 |
|----|:---:|:---:|:---:|:---:|
| community_posts | 读 | 读 | 读写删 | 全部 |
| community_comments | 读 | 读 | 读写删 | 全部 |
| community_likes | 读 | 读 | 写删(自己) | — |
| community_favorites | — | 读(自己) | 写删(自己) | — |
| user_follows | 读 | 读 | 写删(自己) | — |
| community_tags | 读 | 读 | — | 全部 |
| community_post_tags | 读 | 读 | 管理(自己帖子) | 全部 |
| notifications | — | 读(自己) | 更新(自己) | — |

*最后更新: 2026-05-30 — Phase 2 社区模块完整文档*
