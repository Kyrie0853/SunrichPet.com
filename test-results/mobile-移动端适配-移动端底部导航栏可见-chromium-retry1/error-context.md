# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> 移动端适配 >> 移动端底部导航栏可见
- Location: tests\mobile.spec.ts:6:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=论坛')
Expected: visible
Error: strict mode violation: locator('text=论坛') resolved to 2 elements:
    1) <a href="/" class="rounded-md px-3 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">论坛</a> aka getByText('论坛').first()
    2) <span class="text-[10px] font-medium">论坛</span> aka getByRole('link', { name: '论坛' })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=论坛')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e3]:
      - link "Sunrich Pet" [ref=e4] [cursor=pointer]:
        - /url: /
      - generic [ref=e5]:
        - link [ref=e6] [cursor=pointer]:
          - /url: /cart
          - img [ref=e7]
        - link "登录" [ref=e9] [cursor=pointer]:
          - /url: /auth
  - main [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - heading "宠物玩家社区" [level=1] [ref=e14]
          - paragraph [ref=e15]: 分享饲养心得，展示爱宠日常，与全国宠友交流互动
        - link "发布帖子" [ref=e16] [cursor=pointer]:
          - /url: /community/new
          - img [ref=e17]
          - text: 发布帖子
      - generic [ref=e19]:
        - generic [ref=e20]:
          - button "全部" [ref=e21]
          - button "精华" [ref=e22]
          - button "爬宠" [ref=e23]
          - button "水族" [ref=e24]
        - generic [ref=e25]:
          - button "最新" [ref=e26]
          - button "热门" [ref=e27]
          - button "趋势" [ref=e28]
        - generic [ref=e29]:
          - paragraph [ref=e30]: 🐾
          - paragraph [ref=e31]: 暂无帖子
  - navigation [ref=e32]:
    - generic [ref=e33]:
      - link "首页" [ref=e34] [cursor=pointer]:
        - /url: /
        - img [ref=e35]
        - generic [ref=e37]: 首页
      - link "论坛" [ref=e38] [cursor=pointer]:
        - /url: /community
        - img [ref=e39]
        - generic [ref=e41]: 论坛
      - link "商城" [ref=e42] [cursor=pointer]:
        - /url: /shop
        - img [ref=e43]
        - generic [ref=e45]: 商城
      - link "消息" [ref=e46] [cursor=pointer]:
        - /url: /messages
        - img [ref=e47]
        - generic [ref=e49]: 消息
      - link "我的" [ref=e50] [cursor=pointer]:
        - /url: /community/user
        - img [ref=e51]
        - generic [ref=e53]: 我的
  - button "Open Next.js Dev Tools" [ref=e59] [cursor=pointer]:
    - img [ref=e60]
  - alert [ref=e63]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("移动端适配", () => {
  4  |   test.use({ viewport: { width: 375, height: 812 } });
  5  | 
  6  |   test("移动端底部导航栏可见", async ({ page }) => {
  7  |     await page.goto("/");
  8  |     await expect(page.locator("text=首页")).toBeVisible();
> 9  |     await expect(page.locator("text=论坛")).toBeVisible();
     |                                           ^ Error: expect(locator).toBeVisible() failed
  10 |     await expect(page.locator("text=商城")).toBeVisible();
  11 |     await expect(page.locator("text=消息")).toBeVisible();
  12 |     await expect(page.locator("text=我的")).toBeVisible();
  13 |   });
  14 | 
  15 |   test("移动端论坛首页单列布局", async ({ page }) => {
  16 |     await page.goto("/");
  17 |     const cards = page.locator("article");
  18 |     if (await cards.count() > 0) {
  19 |       const box = await cards.first().boundingBox();
  20 |       expect(box!.width).toBeLessThan(380);
  21 |     }
  22 |   });
  23 | 
  24 |   test("移动端商城两列网格", async ({ page }) => {
  25 |     await page.goto("/shop");
  26 |     await page.waitForTimeout(500);
  27 |   });
  28 | 
  29 |   test("移动端导航栏不显示中间链接", async ({ page }) => {
  30 |     await page.goto("/");
  31 |     // 桌面端导航链接在移动端应该隐藏
  32 |     const navLinks = page.locator("nav a[href='/shop']").first();
  33 |     await expect(navLinks).not.toBeVisible();
  34 |   });
  35 | });
  36 | 
```