# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: forum.spec.ts >> 论坛核心 >> 发帖页需要登录
- Location: tests\forum.spec.ts:47:7

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
  3  | test.describe("论坛核心", () => {
  4  |   test("论坛首页可以加载", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await expect(page.locator("text=宠物玩家社区")).toBeVisible();
  7  |   });
  8  | 
  9  |   test("分类 Tab 可以切换", async ({ page }) => {
  10 |     await page.goto("/");
  11 |     await page.locator("text=爬宠").click();
  12 |     await page.waitForTimeout(500);
  13 |     await expect(page).toHaveURL(/\//);
  14 |   });
  15 | 
  16 |   test("排序按钮可以切换", async ({ page }) => {
  17 |     await page.goto("/");
  18 |     await page.locator("text=热门").click();
  19 |     await page.waitForTimeout(300);
  20 |     await expect(page.locator("text=热门")).toBeVisible();
  21 |   });
  22 | 
  23 |   test("搜索帖子功能", async ({ page }) => {
  24 |     await page.goto("/search?q=守宫&tab=posts");
  25 |     await expect(page.locator("text=搜索")).toBeVisible();
  26 |   });
  27 | 
  28 |   test("搜索空结果提示", async ({ page }) => {
  29 |     await page.goto("/search?q=zzzznotexist999&tab=posts");
  30 |     await expect(page.locator("text=未找到相关内容")).toBeVisible();
  31 |   });
  32 | 
  33 |   test("搜索商品", async ({ page }) => {
  34 |     await page.goto("/search?q=守宫&tab=products");
  35 |     await expect(page.locator("text=搜索")).toBeVisible();
  36 |   });
  37 | 
  38 |   test("帖子详情页可访问", async ({ page }) => {
  39 |     await page.goto("/community");
  40 |     const link = page.locator("a[href*='/community/post/']").first();
  41 |     if (await link.count() > 0) {
  42 |       await link.click();
  43 |       await expect(page.locator("text=浏览")).toBeVisible();
  44 |     }
  45 |   });
  46 | 
  47 |   test("发帖页需要登录", async ({ page }) => {
  48 |     await page.goto("/community/new");
> 49 |     await page.waitForURL("**/auth**");
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  50 |   });
  51 | });
  52 | 
```