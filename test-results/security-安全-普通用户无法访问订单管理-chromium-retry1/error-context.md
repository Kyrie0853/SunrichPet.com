# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> 安全 >> 普通用户无法访问订单管理
- Location: tests\security.spec.ts:19:7

# Error details

```
Error: expect(received).toBeFalsy()

Received: true
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e3]:
      - link "Sunrich Pet" [ref=e4] [cursor=pointer]:
        - /url: /
      - generic [ref=e5]:
        - link "论坛" [ref=e6] [cursor=pointer]:
          - /url: /
        - link "商城" [ref=e7] [cursor=pointer]:
          - /url: /shop
      - generic [ref=e9]:
        - textbox "搜索帖子、商品..." [ref=e10]
        - button [ref=e11]:
          - img [ref=e12]
      - generic [ref=e14]:
        - link [ref=e15] [cursor=pointer]:
          - /url: /cart
          - img [ref=e16]
        - link "登录" [ref=e18] [cursor=pointer]:
          - /url: /auth
  - main [ref=e19]:
    - generic [ref=e21]:
      - paragraph [ref=e22]: "404"
      - heading "页面未找到" [level=1] [ref=e23]
      - paragraph [ref=e24]: 你访问的页面不存在或已下架
      - link "返回首页" [ref=e25] [cursor=pointer]:
        - /url: /
  - button "Open Next.js Dev Tools" [ref=e31] [cursor=pointer]:
    - img [ref=e32]
  - alert [ref=e35]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("安全", () => {
  4  |   test("普通用户无法访问管理后台", async ({ page }) => {
  5  |     await page.goto("/admin");
  6  |     await page.waitForTimeout(1000);
  7  |     // 未登录用户应该被重定向或显示404
  8  |     const url = page.url();
  9  |     expect(url.includes("/admin")).toBeFalsy();
  10 |   });
  11 | 
  12 |   test("普通用户无法访问举报管理", async ({ page }) => {
  13 |     await page.goto("/admin/reports");
  14 |     await page.waitForTimeout(1000);
  15 |     const url = page.url();
  16 |     expect(url.includes("/admin")).toBeFalsy();
  17 |   });
  18 | 
  19 |   test("普通用户无法访问订单管理", async ({ page }) => {
  20 |     await page.goto("/admin/orders");
  21 |     await page.waitForTimeout(1000);
  22 |     const url = page.url();
> 23 |     expect(url.includes("/admin")).toBeFalsy();
     |                                    ^ Error: expect(received).toBeFalsy()
  24 |   });
  25 | 
  26 |   test("编辑帖子页需要登录", async ({ page }) => {
  27 |     await page.goto("/community/post/00000000-0000-0000-0000-000000000001/edit");
  28 |     await page.waitForURL("**/auth**");
  29 |   });
  30 | });
  31 | 
```