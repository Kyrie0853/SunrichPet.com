# CLAUDE.md — 给我爬 个人爬宠工作室直营商城

> 最后更新：2026-07-23
> 当前分支：dev/v2-platform
> 部署状态：Vercel 生产环境 (sunrich-pet.top)

---

## 一、项目定位（当前最终状态）

| 项目 | 内容 |
|------|------|
| 网站名称 | 给我爬 |
| 定位 | 个人爬宠工作室直营商城（单店模式） |
| 域名 | sunrich-pet.top（Cloudflare DNS → Vercel 部署） |
| 技术栈 | Next.js 16 + TypeScript + Tailwind CSS v4 + Supabase + Vercel |
| 支付方式 | 支付宝担保交易（主）+ 微信转账确认（备用） |
| 当前阶段 | 个人工作室直营（已完成战略转型，移除社区/论坛/博客） |

### 核心功能

1. 首页分类入口 — 物种分类卡片（守宫、蛇等），点击进入该分类商品列表
2. 商品列表页 — 支持按状态、物种、品系、价格筛选 + 两级分类
3. 商品详情页 — 图片轮播、固定信息表、个体描述、包损条款、评价区
4. 支付宝担保交易 — 用户下单 → 跳转支付宝支付 → 异步通知自动更新订单状态
5. 微信转账 — 备用方案，用户提交订单后扫码转账，管理员手动确认
6. 订单担保流程 — pending → paid → shipped → completed（48h 验货期）
7. 管理员后台 — /studio/dashboard 商品管理、订单管理、发货
8. 超级管理员 — 用户角色管理（/admin/users）

### 已删除的功能

社区/论坛/吧/私信/繁育笔记/博客/积分系统/卖家入驻 — 战略转型为单店直营模式。

---

## 二、完整路由结构

### 前台公开页面

| 路由 | 页面 | 说明 |
|------|------|------|
| / | 首页 | 物种分类卡片 + 搜索入口 |
| /shop | 商品列表 | 支持多条件筛选（Server Component） |
| /shop/product/[id] | 商品详情 | 图片画廊、信息表、包损条款、评价 |
| /search | 搜索结果 | |
| /encyclopedia | 品种百科 | |
| /encyclopedia/[slug] | 百科详情 | 守宫/蛇/龟等品种介绍 |
| /guide | 新手养宠指南 | |
| /guide/[slug] | 指南文章 | |
| /help | 帮助中心 | |
| /help/faq | 常见问题 | |
| /help/newbie | 新手指南 | |
| /help/trade | 交易须知 | |
| /help/after-sale | 售后政策 | |
| /rules | 平台规则 | |
| /rules/prohibited | 违禁品规则 | |
| /rules/after-sale | 售后规则 | |
| /about | 关于我们 | |
| /offline | 离线页面 | PWA 离线支持 |

### 需登录

| 路由 | 页面 | 说明 |
|------|------|------|
| /auth | 登录/注册 | Supabase Auth |
| /auth/callback | OAuth 回调 | |
| /profile | 个人信息 | |
| /profile/edit | 编辑资料 | |
| /cart | 购物车 | |
| /checkout | 确认订单 | 选择支付方式 + 填写收货信息 |
| /orders | 我的订单 | |
| /orders/[id] | 订单详情 | 含时间线、操作按钮 |
| /reviews | 我的评价 | |

### 管理员 (admin)

| 路由 | 页面 | 说明 |
|------|------|------|
| /admin/orders | 订单管理 | 列表 + 确认收款 + 发货弹窗 |
| /admin/products | 商品管理 | |
| /admin/users | 用户管理 | 搜索用户、封禁/解封 |
| /admin/settings | 系统设置 | |
| /studio/dashboard | 管理后台首页 | |
| /studio/dashboard/products | 商品管理 | 列表、上下架 |
| /studio/dashboard/products/new | 添加商品 | |
| /studio/dashboard/products/[id]/edit | 编辑商品 | |
| /studio/dashboard/orders | 订单管理 | |

### 超管专属 (super_admin)

| 路由 | 页面 | 说明 |
|------|------|------|
| /admin/settings | 用户角色设置 | 任命/撤销管理员 |

### API 路由

| 路由 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| /api/orders/create | POST | 需登录 | 创建订单 + 生成支付宝支付 URL |
| /api/orders/notify | POST | 公开 | 支付宝异步通知回调 |
| /api/orders/[id]/confirm | POST | 需登录 | 买家确认收货 |
| /api/orders/[id]/refund | POST | 需登录 | 买家申请退款 |
| /api/orders/[id]/ship | POST | admin | 管理员发货 |
| /api/orders/confirm-wechat | POST | admin | 管理员确认微信收款 |
| /api/checkout | POST | 需登录 | 通用下单（手动模式） |
| /api/admin/orders/[id]/confirm-payment | POST | admin | 管理员确认收款 |
| /api/admin/orders/[id]/status | PATCH | admin | 修改订单状态 |
| /api/admin/refunds/[id] | POST | admin | 处理退款申请 |
| /api/studio/categories | GET | 公开 | 获取商品分类 |
| /api/studio/products | GET/POST | 公开/admin | 商品 CRUD |
| /api/studio/products/[id] | PUT/DELETE | admin | 商品编辑/删除 |
| /api/health | GET | 公开 | 健康检查 |

---

## 三、数据库核心表

### 活跃表（生产环境在用）

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| profiles | 用户信息 | id, username, role, phone, shipping_address |
| studio_products | 工作室商品 | product_id, name, species, morph, price, status, images, category_id |
| product_categories | 两级分类 | id, name, slug, parent_id |
| orders | 订单 | user_id, product_id, product_name, status, total_amount, shipping_address, payment_method, paid_at, alipay_trade_no, tracking_number, inspection_deadline |
| order_logs | 订单操作日志 | order_id, action, operator_id, details |
| studio_reviews | 商品评价 | product_id, user_id, rating, content |
| seller_balances | 商家余额 | seller_id, available_balance, pending_balance |
| refund_requests | 退款申请 | order_id, user_id, reason, refund_amount, status |
| admin_logs | 管理操作日志 | admin_id, action, target_type, target_id, details |
| carts / cart_items | 购物车 | （保留但可能未使用） |

### 已废弃但未删除的表

不要误操作这些表。如果未来需要清理，应先在测试环境验证。

- community_posts — 社区帖子
- community_comments — 社区评论
- bars / bar_members / bar_admins — 社区吧/区主管辖
- conversations / messages — 私信
- notifications — 通知
- reports — 举报
- blog_posts — 繁育笔记
- products — 传统商品表（已被 studio_products 替代）
- points_transactions — 积分
- tags — 标签
- seller_documents — 卖家认证
- featured_posts — 精选帖子

---

## 四、重大 Bug 历史与教训

### 架构级

| 日期 | 问题 | 根因 | 教训 |
|------|------|------|------|
| 2026-07 | RLS 策略无限递归 (42P17) | profiles 表 RLS 策略中直接引用了自身表，Supabase 展开策略时形成循环 | RLS 策略禁止直接查询同表，必须用 SECURITY DEFINER 函数包裹 |
| 2026-07 | profiles 表被清空 | 某次迁移意外清空数据 | 数据库迁移前必须备份；触发器必须健壮 |
| 2026-07 | 首页显示暂无在售爬宠 | getSpeciesCategories() 用 result.length > 0 而非 result.some(c => c.count > 0) | 聚合查询必须检查聚合后的业务指标 |
| 2026-07 | 27 条策略名残留致递归 | DROP POLICY 使用构造名而非实际名 | 删策略前用 pg_policies 查真实名 |

### 功能级

| 日期 | 问题 | 根因 | 教训 |
|------|------|------|------|
| 2026-07-23 | 支付宝提交订单无任何反应 | payUrl 为 null → 落入 else 分支 → WeChat UI 检查失败 → 渲染回表单，loading 未重置 | 异步操作三态（成功/失败/null）必须全部处理 |
| 2026-07 | Tailwind v4 构建 CSS 丢失 | @source 指令未配置 | 升级主版本依赖后必须验证生产构建 |
| 2026-07-23 | Vercel 构建 Node.js 20.x deprecated | Vercel 弃用旧版本 | engines.node 必须保持最新 |
| 2026-07 | admin 后台看不到用户 | profiles 缺记录 + RLS 错误 | 触发器健壮 + 服务端 client |
| 2026-07 | shop 页面崩溃 | Server Component 中使用 onClick | Server Component 不能有交互事件 |
| 2026-07 | 个人信息页反复空白 | profiles 被清空 + RLS 递归 | 每次修改后必验该页面 |
| 2026-07 | 首页繁育笔记残留 | 删除功能时未全站搜索 | 删除必 grep -r 全站 |

### 环境/配置

| 日期 | 问题 | 根因 | 教训 |
|------|------|------|------|
| 2026-07 | 支付宝签名失败 | 时间戳格式不对 + 私钥未转义 | 第三方 API 严格对照文档 |
| 2026-07 | CSP 阻止支付宝跳转 | 未放行支付宝域名 | 集成第三方时 CSP 同步更新 |

---

## 五、开发禁忌（绝对不允许做的事）

以下每条铁律都源于血泪教训，违反必出事故。

1. 永远不要在生产环境直接修改数据库表结构。所有 DDL 必须先在本地/测试环境验证。
2. 删除任何功能/路由/组件时，必须 grep -r 全局搜索相关引用，确保零残留。
3. RLS 策略中禁止直接查询同表。必须使用 SECURITY DEFINER 函数，并在函数内 SET search_path = ''。
4. 所有第三方 API 密钥/私钥必须存放在 Vercel 环境变量中，禁止硬编码或出现在代码中。
5. 不得在 Server Component 中使用 onClick、useState、useEffect 等客户端特性。Next.js 16 会直接构建失败。
6. 升级主版本依赖（Tailwind、Next.js 等）后，必须先本地 npm run build 验证生产构建，再推送。
7. 管理员功能按钮/入口绝对不能出现在面向普通用户的页面中。
8. 前端数据获取必须有 try-catch 和 error.tsx 边界，不能因为某个查询失败导致整个页面白屏。
9. 异步操作的返回值必须处理三态：成功、失败、null/undefined。特别是 payUrl 这类可能为 null 的关键字段。
10. Next.js 16 中 searchParams 和 params 都是 Promise，必须 await 后才能访问。

---

## 六、每次修改后必验的 3 个核心页面

这些页面是最容易崩溃的，每次代码变更后必须确认正常：

1. 首页 / — 分类卡片正常展示，点击可跳转
2. 个人信息 /profile — 页面不空白，数据显示正确
3. 商品列表 /shop — 商品列表正常加载，筛选功能正常

---

## 七、关键环境变量

| 变量名 | 用途 | 状态 |
|--------|------|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 项目 URL | 已配置 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 匿名密钥 | 已配置 |
| ALIPAY_APP_ID | 支付宝应用 ID | 已配置 |
| ALIPAY_PRIVATE_KEY | 应用私钥（PEM 格式，
 换行） | 已配置 |
| ALIPAY_PUBLIC_KEY | 支付宝公钥（PEM 格式） | 已配置 |
| ALIPAY_NOTIFY_URL | 异步通知回调 | 已配置 |
| ALIPAY_RETURN_URL | 支付完成跳回 | 已配置 |
| ALIPAY_SANDBOX | 沙箱模式开关（生产改为 false） | 当前为 true |

---

## 八、当前待解决问题

| 优先级 | 问题 | 状态 |
|--------|------|------|
| 高 | 支付宝沙箱测试 — 验证完整支付流程 | 进行中 |
| 中 | ALIPAY_SANDBOX 切为 false 后正式上线 | 测试通过后执行 |
| 中 | 微信支付目前是手动确认模式，需后续升级 | 待排期 |
| 低 | 旧数据库表（社区相关）评估是否删除 | 低优先级 |
| 低 | seller_id 写入订单但当前无商家端后台 | 单店模式暂不需要 |

---

> 本文档是项目宪法，每次和 Claude Code 开始新会话时自动加载。任何违反本文档原则的操作都应被拒绝。
