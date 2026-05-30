# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> 用户认证 >> 未登录访问需登录页面自动跳转
- Location: tests\auth.spec.ts:10:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/auth**" until "load"
  navigated to "http://localhost:3000/community/new"
============================================================
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
    - generic [ref=e20]:
      - heading "发布帖子" [level=1] [ref=e21]
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]: 标题
          - textbox "给你的帖子起个吸引人的标题..." [ref=e25]
          - paragraph [ref=e26]: 0/200
        - generic [ref=e27]:
          - generic [ref=e28]: 分类
          - combobox [ref=e29]:
            - option "选择分类" [selected]
            - option "精华"
            - option "爬宠"
            - option "水族"
        - generic [ref=e30]:
          - generic [ref=e31]: 内容
          - textbox "分享你的养宠心得、经验、故事..." [ref=e32]
          - paragraph [ref=e33]: 0 字（至少 10 字）
        - generic [ref=e34]:
          - generic [ref=e35]: 标签（可选）
          - generic [ref=e36]:
            - button "器材评测" [ref=e37]
            - button "守宫" [ref=e38]
            - button "小宠" [ref=e39]
            - button "开箱分享" [ref=e40]
            - button "疾病求助" [ref=e41]
            - button "蛇类" [ref=e42]
            - button "观赏鱼" [ref=e43]
            - button "饲养教程" [ref=e44]
            - button "鸟类" [ref=e45]
            - button "龟类" [ref=e46]
        - generic [ref=e47]:
          - text: 图片
          - button "Choose File" [ref=e48]
        - generic [ref=e49]:
          - button "发布帖子" [ref=e50]
          - button "取消" [ref=e51]
  - button "Open Next.js Dev Tools" [ref=e57] [cursor=pointer]:
    - img [ref=e58]
  - alert [ref=e61]
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
> 12 |     await page.waitForURL("**/auth**");
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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
  38 |     await expect(page.locator("button[type=submit]")).toBeVisible();
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