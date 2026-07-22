# 支付宝担保交易接入指南

## 1. 支付宝开放平台注册

1. 访问 [支付宝开放平台](https://open.alipay.com/) 注册并认证
2. 创建应用 → 选择「网页/移动应用」
3. 在「功能列表」中添加「电脑网站支付」和「手机网站支付」
4. 获取 **APP_ID**（应用ID）

## 2. 密钥生成

```bash
# 生成应用私钥
openssl genrsa -out app_private_key.pem 2048

# 生成应用公钥
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem
```

将 **应用公钥** 上传到支付宝开放平台「应用详情 → 开发设置 → 应用公钥」，获取 **支付宝公钥**。

## 3. 环境变量配置

在 Vercel Dashboard → Settings → Environment Variables 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ALIPAY_APP_ID` | 202100xxxxxxxx | 应用ID |
| `ALIPAY_PRIVATE_KEY` | `-----BEGIN RSA PRIVATE KEY-----\nMII...\n-----END RSA PRIVATE KEY-----` | 应用私钥（含换行符） |
| `ALIPAY_PUBLIC_KEY` | `-----BEGIN PUBLIC KEY-----\nMII...\n-----END PUBLIC KEY-----` | 支付宝公钥 |
| `ALIPAY_NOTIFY_URL` | `https://你的域名.com/api/orders/notify` | 异步通知回调 |
| `ALIPAY_RETURN_URL` | `https://你的域名.com/orders` | 支付完成跳转 |
| `ALIPAY_SANDBOX` | `true` | 沙箱测试环境（生产时删除或设为 false） |

## 4. 沙箱测试

1. 登录 [支付宝开放平台沙箱](https://openhome.alipay.com/develop/sandbox/app)
2. 使用沙箱买家账号和支付密码测试
3. 下载沙箱支付宝 App 扫码测试

## 5. 订单状态流转

```
用户下单 → pending(待支付)
→ 支付宝付款 → paid(已支付)
→ 管理员发货 → shipped(已发货)
→ 用户确认收货 → completed(已完成)
→ (48h超时自动确认)
```

## 6. API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/orders/create` | POST | 创建订单 → 返回支付宝支付URL |
| `/api/orders/notify` | POST | 支付宝异步通知回调 |
| `/api/orders/[id]/ship` | POST | 管理员发货 |
| `/api/orders/[id]/confirm` | POST | 买家确认收货 |

## 7. 生产环境切换

1. 删除 `ALIPAY_SANDBOX` 环境变量
2. 使用正式应用参数
3. 确认异步通知 URL 为正式域名
