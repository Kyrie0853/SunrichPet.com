# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> 用户认证 >> 密码登录表单包含邮箱和密码输入框
- Location: tests\auth.spec.ts:32:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button[type=submit]')
Expected: visible
Error: strict mode violation: locator('button[type=submit]') resolved to 2 elements:
    1) <button type="submit" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-emerald-600">…</button> aka getByRole('navigation').getByRole('button')
    2) <button type="submit" class="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">登录</button> aka getByRole('button', { name: '登录', exact: true })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('button[type=submit]')

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
      - heading "顺瑞益宠" [level=1] [ref=e22]
      - paragraph [ref=e23]: 登录或注册账号
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]: 邮箱地址
          - textbox "your@email.com" [ref=e27]
        - generic [ref=e28]:
          - generic [ref=e29]: 密码
          - textbox "输入登录密码" [ref=e30]
        - button "登录" [ref=e31]
        - button "使用验证码登录" [ref=e32]
        - button "忘记密码？" [ref=e33]
  - button "Open Next.js Dev Tools" [ref=e39] [cursor=pointer]:
    - img [ref=e40]
  - alert [ref=e43]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("用户认证", () => {
  4  |   test("登录页面可以正常加载", async ({ page }) => {
  5  |     await page.goto("/auth");
  6  |     await expect(page.locator("text=顺瑞益宠")).toBeVisible();
  7  |     await expect(page.locator("input[type=email]")).toBeVisible();
  8  |   });
  9  | 
  10 |   test("未登录访问需登录页面自动跳转", async ({ page }) => {
  11 |     await page.goto("/community/new");
  12 |     await page.waitForURL("**/auth**");
  13 |     await expect(page.locator("input[type=email]")).toBeVisible();
  14 |   });
  15 | 
  16 |   test("未登录访问私信跳转登录页", async ({ page }) => {
  17 |     await page.goto("/messages");
  18 |     await page.waitForURL("**/auth**");
  19 |     await expect(page.locator("input[type=email]")).toBeVisible();
  20 |   });
  21 | 
  22 |   test("未登录访问下单跳转登录页", async ({ page }) => {
  23 |     await page.goto("/checkout");
  24 |     await page.waitForURL("**/auth**");
  25 |   });
  26 | 
  27 |   test("导航栏显示登录按钮（未登录状态）", async ({ page }) => {
  28 |     await page.goto("/");
  29 |     await expect(page.locator("text=登录")).toBeVisible();
  30 |   });
  31 | 
  32 |   test("密码登录表单包含邮箱和密码输入框", async ({ page }) => {
  33 |     await page.goto("/auth");
  34 |     await page.locator("text=使用密码登录").click();
  35 |     await page.waitForTimeout(300);
  36 |     await expect(page.locator("input[type=email]")).toBeVisible();
  37 |     await expect(page.locator("input[type=password]")).toBeVisible();
> 38 |     await expect(page.locator("button[type=submit]")).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  39 |   });
  40 | 
  41 |   test("忘记密码跳转到邮箱验证步骤", async ({ page }) => {
  42 |     await page.goto("/auth");
  43 |     await page.locator("text=使用密码登录").click();
  44 |     await page.waitForTimeout(300);
  45 |     await page.locator("text=忘记密码").click();
  46 |     await page.waitForTimeout(300);
  47 |     await expect(page.locator("input[type=email]")).toBeVisible();
  48 |     await expect(page.locator("text=发送验证码")).toBeVisible();
  49 |   });
  50 | 
  51 |   test("个人资料编辑页需要登录", async ({ page }) => {
  52 |     await page.goto("/profile/edit");
  53 |     await page.waitForURL("**/auth**");
  54 |   });
  55 | });
  56 | 
```