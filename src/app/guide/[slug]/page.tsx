import Link from "next/link";
import type { Metadata } from "next";

const GUIDES: Record<string, { title: string; content: string }> = {
  "how-to-buy": {
    title: "如何浏览与购买",
    content: `## 浏览商品

在给我爬商城，您可以通过以下方式找到心仪的爬宠：

### 分类浏览
首页展示了所有爬宠分类卡片（守宫、蛇类、龟类等），点击分类即可查看该类别下的所有在售个体。

### 筛选功能
在商品列表页，您可以使用以下筛选条件：
- 状态筛选：可发货 / 预售中 / 全部
- 价格筛选：¥500以下、¥500-1000、¥1000-3000、¥3000以上
- 子分类筛选：不同品系的细分

### 搜索
在导航栏搜索框中输入关键词（品种名、基因品系等）快速查找。

## 查看商品详情

点击商品卡片进入详情页，可以看到：
- 多张高清图片
- 基因品系、出生日期、当前体重
- 性格特点标签
- 预计发货日期
- 个体描述
- 包损条款

## 提交订单

1. 点击"立即购买"进入确认订单页面
2. 也可以点击"加入购物车"，将多个商品加入后统一结算
3. 填写收货信息：收货人姓名、11位手机号、详细地址
4. 支持智能粘贴：复制包含姓名、电话、地址的文本，粘贴到识别框即可自动填写
5. 可选填写买家留言
6. 点击"提交订单"

## 小贴士

- 购物车使用浏览器本地存储，不同设备不同步
- 下单无需注册登录
- 提交订单后请在订单详情页扫码支付`,
  },
  "how-to-pay": {
    title: "如何支付",
    content: `## 支付方式

给我爬目前支持**微信扫码支付**，流程简单安全。

## 支付步骤

### 第一步：添加客服微信
添加客服微信：**geiwopa112**

### 第二步：提交订单
在商城选择商品 → 填写收货信息 → 提交订单 → 获得订单编号

### 第三步：扫码支付
- 在订单成功页面扫描微信收款码
- 或在订单详情页查看收款码

### 第四步：转账备注
在微信转账时，务必在**备注**中填写订单编号（如 #ABC12345），方便客服核对。

### 第五步：等待确认
支付完成后，联系客服微信 geiwopa112 告知已付款。客服核对后会在后台确认收款，订单状态将更新为"已付款"。

## 注意事项

- 请务必在转账备注中填写订单编号
- 如忘记备注，请截图转账记录发送给客服
- 客服工作时间为 9:00-21:00，非工作时间请留言
- 客服微信：**geiwopa112**`,
  },
  "receiving-guide": {
    title: "收货验货指南",
    content: `## 收货前准备

- 确保收件地址有人签收
- 准备好开箱录像设备（手机即可）
- 了解当天的天气情况

## 开箱视频录制要求

### 必须包含以下内容：
1. **快递单号特写**：视频开头对准快递面单，清晰拍到单号
2. **包裹六面展示**：旋转包裹，证明包裹未拆封
3. **完整开箱过程**：从拆封到取出宠物，全程无剪辑、无中断
4. **宠物特写**：取出后近距离拍摄宠物状态

### 视频要求：
- 一镜到底，不可剪辑
- 光线充足，画面清晰
- 拍摄时间不超过签收后6小时

## 包损条款

**开箱死亡，无条件退款或重发。**

具体规则：
- 请在签收后 **6 小时内**，凭完整无剪辑开箱视频联系客服
- 超时或无开箱视频，将无法处理赔付
- 商家在商品描述中已明确说明的瑕疵，不属于赔付范围
- 因买家提供错误地址、未及时签收导致的损失，由买家承担

## 如有问题

- 立即联系客服微信：**geiwopa112**
- 保留开箱视频和所有包装材料
- 拍摄清晰的问题照片/视频作为凭证`,
  },
  "care-basics": {
    title: "爬宠饲养基础",
    content: `## 守宫类饲养基础

### 饲养箱
- 幼体：30x20x15cm
- 成体：60x40x30cm
- 必备：加热垫（配温控器）、躲避穴x2、水盆、温湿度计

### 温度
- 热区：32-35°C（豹纹守宫）/ 24-28°C（睫角守宫）
- 冷区：24-26°C
- 使用温控器精确控温，避免过热

### 喂食
- 豹纹守宫：蟋蟀、面包虫、杜比亚蟑螂（沾钙粉+维生素D3）
- 睫角守宫：专用果泥饲料（不需活虫）
- 幼体每天喂，成体2-3天喂一次

### 垫材
- 推荐：厨房纸巾（幼体）、宠物地毯
- 避免：散沙（易误食导致肠梗阻）

## 蛇类饲养基础

### 饲养箱
- 幼蛇：30x20x15cm
- 成蛇（玉米蛇）：90x45x45cm
- 关键：盖子必须牢固！蛇是逃跑大师

### 温度与湿度
- 热区：30-32°C / 冷区：24-26°C
- 湿度：40-60%（蜕皮期提高至60-70%）

### 喂食
- 只喂冻鼠，不喂活鼠（活鼠可能咬伤蛇）
- 幼蛇每周1次乳鼠
- 成蛇每7-14天1次成体鼠
- 喂食后48小时内不要打扰

### 蜕皮护理
- 蜕皮前眼睛变浑浊（蓝眼期）
- 提高湿度至60-70%
- 提供粗糙表面帮助蜕皮

## 通用建议

- 新宠到家后静养2-3天再喂食
- 定期清洁饲养箱，保持卫生
- 发现异常行为及时咨询有经验的饲养者
- 更多品种信息请查看 [品种百科](/encyclopedia)`,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDES[slug];
  return { title: (g?.title || "指南") + " — 给我爬" };
}

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;
    if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-[#1f2937] mt-8 mb-3 pb-2 border-b">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold text-[#1f2937] mt-6 mb-2">{line.slice(4)}</h3>;
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-[15px] font-bold text-[#1f2937] mt-4">{line.slice(2, -2)}</p>;
    if (line.match(/^\d+\./)) return <p key={i} className="text-[15px] text-[#4b5563] leading-relaxed ml-4">{line}</p>;
    if (line.startsWith("- ")) return <li key={i} className="ml-4 text-[15px] text-[#4b5563] leading-relaxed">{line.slice(2)}</li>;
    return <p key={i} className="text-[15px] text-[#4b5563] leading-relaxed">{line}</p>;
  });
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES[slug];

  if (!guide) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">📭</p>
        <h1 className="text-xl font-bold text-[#1f2937] mb-2">指南未找到</h1>
        <p className="text-[#6b7280] mb-6">该指南页面不存在</p>
        <Link href="/guide" className="rounded-full bg-[#1a7f5a] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b]">返回指南首页</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/guide" prefetch={true} className="text-[13px] text-[#6b7280] hover:text-[#1a7f5a] mb-6 inline-block">&larr; 返回指南首页</Link>
      <h1 className="text-3xl font-bold text-[#1f2937] mb-2">{guide.title}</h1>
      <p className="text-[#9ca3af] text-[13px] mb-8">给我爬 · 个人爬宠工作室直营商城</p>
      <div className="prose max-w-none">{renderContent(guide.content)}</div>
      <div className="mt-12 pt-6 border-t flex flex-wrap gap-4">
        <Link href="/shop" className="text-[13px] text-[#1a7f5a] hover:underline">去商城逛逛 →</Link>
        <Link href="/encyclopedia" className="text-[13px] text-[#1a7f5a] hover:underline">品种百科 →</Link>
      </div>
    </div>
  );
}
