# 顺瑞益宠微信小程序 — 架构文档

## 技术栈
- 框架: Taro 3 (React) + TypeScript
- 数据库: Supabase (复用 Web 项目)
- 认证: wx.login → Supabase signInWithIdToken

## 页面映射

| 小程序路由 | Web 对应 | 状态 |
|-----------|---------|:---:|
| pages/community/index | /b | 骨架 |
| pages/community/bar | /b/[slug] | 骨架 |
| pages/community/post | /community/post/[id] | 骨架 |
| pages/user/index | /community/user/[id] | 骨架 |
| pages/messages/index | /messages | 骨架 |
| pages/messages/chat | /messages/[userId] | 骨架 |

## 可复用代码

| Web 文件 | 复用方式 |
|---------|---------|
| src/lib/supabase/community.ts | 直接复制，去除 React.cache |
| src/lib/supabase/client.ts | 替换为小程序版 supabase client |
| src/lib/supabase/community-types.ts | 直接复制 |
| src/components/community/PostCard.tsx | 用 Taro 组件重写 |

## 需单独适配

| 功能 | 说明 |
|------|------|
| 图片上传 | Taro.chooseImage → supabase.storage |
| 微信登录 | wx.login → supabase.auth.signInWithIdToken |
| 分享 | onShareAppMessage |
| WebSocket | Taro.connectSocket → Supabase Realtime |

## 环境变量 (TARO_APP_*)
- TARO_APP_SUPABASE_URL
- TARO_APP_SUPABASE_ANON_KEY

## 微信公众平台配置
- request 合法域名: https://*.supabase.co
- socket 合法域名: wss://*.supabase.co
- uploadFile 合法域名: https://*.supabase.co
