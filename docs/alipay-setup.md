# 支付宝担保交易配置说明

## 一、支付宝开放平台申请

### 1.1 注册与认证
前往 [支付宝开放平台](https://open.alipay.com/) 完成开发者入驻和企业/个人认证。

### 1.2 创建应用
1. 进入「控制台」→「应用列表」→「创建应用」
2. 选择「网页/移动应用」类型
3. 填写应用名称（如"XX爬宠工作室"）
4. 上传应用图标

### 1.3 绑定产品
在应用详情页 →「产品绑定」中，添加以下产品：
- **电脑网站支付** (alipay.trade.page.pay)
- **手机网站支付** (alipay.trade.wap.pay)

### 1.4 配置密钥
1. 下载 [支付宝密钥生成器](https://opendocs.alipay.com/open/291/105971) 或使用 openssl
2. 生成 RSA2 (2048位) 密钥对：
   ```bash
   # 生成私钥
   openssl genrsa -out private_key.pem 2048
   # 生成公钥
   openssl rsa -in private_key.pem -pubout -out public_key.pem
   ```
3. 将生成的**公钥**上传到支付宝开放平台（应用详情 →「开发设置」→「接口加签方式」）
4. 保存好私钥（不包含密码的 PKCS8 格式），后续需要配置到环境变量

### 1.5 配置回调地址
在应用详情 →「开发设置」中：
- **应用网关地址**：留空或填写 `https://sunrich-pet.top`
- **授权回调地址**：`https://sunrich-pet.top/api/orders/notify`

## 二、环境变量配置清单

在 Vercel 项目设置（Settings → Environment Variables）中添加以下变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `ALIPAY_APP_ID` | 支付宝应用 ID | `2021004123456789` |
| `ALIPAY_PRIVATE_KEY` | 商户私钥（PKCS8，不含密码） | `MIIEvgIBADANBgkq...` (完整私钥) |
| `ALIPAY_PUBLIC_KEY` | 支付宝公钥 | `MIIBIjANBgkqh...` (完整公钥) |
| `ALIPAY_NOTIFY_URL` | 异步通知地址 | `https://sunrich-pet.top/api/orders/notify` |
| `ALIPAY_RETURN_URL` | 同步跳转地址（支付完成后） | `https://sunrich-pet.top/orders` |
| `ALIPAY_GATEWAY` | 支付宝网关（可选，默认正式环境） | `https://openapi.alipay.com/gateway.do` |
| `ALIPAY_SANDBOX` | 沙箱模式开关（测试时设为 `true`） | `true` / `false` |

### 沙箱测试环境
开发测试阶段，建议使用支付宝沙箱环境：
1. 访问 [支付宝沙箱](https://openhome.alipay.com/develop/sandbox/app)
2. 获取沙箱 APP ID、沙箱网关
3. 使用沙箱买家账号进行测试支付
4. 设置 `ALIPAY_SANDBOX=true`
5. 沙箱网关: `https://openapi-sandbox.dl.alipaydev.com/gateway.do`

## 三、支付流程

### 3.1 担保交易流程
```
用户下单 → 付款到支付宝担保账户
  → 商家发货并录入物流单号
    → 用户确认收货
      → 款项自动结算到商家账户
```

### 3.2 API 接口

#### 创建订单（发起支付）
```
POST /api/orders/create
Content-Type: application/json

{
  "product_id": "G2024001",
  "shipping_address": "姓名、电话、详细地址",
  "buyer_message": "买家留言（可选）"
}

Response:
{
  "success": true,
  "orderId": "uuid",
  "payUrl": "https://openapi.alipay.com/gateway.do?..."  // 支付宝支付页面
}
```

#### 异步通知回调
```
POST /api/orders/notify
（由支付宝服务器自动调用，无需手动调用）

支付宝会发送 trade_no（支付宝交易号）、out_trade_no（我方订单号）等参数
验证签名后更新订单状态为"已付款"
```

#### 发货接口
```
POST /api/orders/{id}/ship
Content-Type: application/json

{
  "tracking_number": "SF1234567890",
  "tracking_company": "顺丰速运"
}
```

## 四、注意事项

1. **私钥安全**：ALIPAY_PRIVATE_KEY 绝对不能泄露，不要提交到 Git
2. **签名验证**：异步通知必须验证签名，防止伪造回调
3. **幂等处理**：异步通知可能重复发送，需要做幂等处理
4. **HTTPS 必须**：回调地址必须使用 HTTPS（生产环境）
5. **金额一致性**：服务端必须重新计算订单金额，不信任前端
6. **沙箱切换**：上线前确保 `ALIPAY_SANDBOX=false`
