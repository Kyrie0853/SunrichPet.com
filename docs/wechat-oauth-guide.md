# 微信 OAuth 登录配置指南

## 一、微信开放平台申请

1. 访问 https://open.weixin.qq.com ，注册并登录（个人开发者即可）
2. 进入「管理中心」→「网站应用」→「创建网站应用」
3. 填写：
   - **网站名称**：给我爬
   - **网站简介**：爬宠交易商城
   - **网站域名**：sunrich-pet.top
   - **图标**：上传网站 logo（可用 `/public/icons/icon-512.png`）
4. 提交审核（审核通常 1-3 个工作日）
5. 审核通过后，进入应用详情 → 获取 **AppID** 和 **AppSecret**

## 二、配置 Supabase

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 → **Authentication** → **Providers**
3. 找到 **WeChat**（微信），展开
4. 填入：
   - **AppID (Client ID)**：微信开放平台的 AppID
   - **AppSecret (Client Secret)**：微信开放平台的 AppSecret
5. 保存

## 三、配置微信开放平台回调地址

1. 回到微信开放平台 → 应用详情 → 功能设置 →「网页授权域名」
2. 填写回调域名（注意：**只需填域名，不加协议和路径**）：
   ```
   xokzjaaahbctzgelhiap.supabase.co
   ```
   > 这是你的 Supabase 项目 ID 对应的域名

3. 如果是「开发信息」→「回调地址」，填写完整 URL：
   ```
   https://xokzjaaahbctzgelhiap.supabase.co/auth/v1/callback
   ```

## 四、验证

1. 部署代码后访问 https://sunrich-pet.top/auth
2. 点击「微信登录」
3. 微信扫码 → 授权 → 自动返回网站 → 登录成功
