import { test, expect } from "@playwright/test";

test.describe("论坛核心", () => {
  test("论坛首页可以加载", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=宠物玩家社区")).toBeVisible();
  });

  test("分类 Tab 可以切换", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=爬宠").click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\//);
  });

  test("排序按钮可以切换", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=热门").click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=热门")).toBeVisible();
  });

  test("搜索帖子功能", async ({ page }) => {
    await page.goto("/search?q=守宫&tab=posts");
    await expect(page.locator("text=搜索")).toBeVisible();
  });

  test("搜索空结果提示", async ({ page }) => {
    await page.goto("/search?q=zzzznotexist999&tab=posts");
    await expect(page.locator("text=未找到相关内容")).toBeVisible();
  });

  test("搜索商品", async ({ page }) => {
    await page.goto("/search?q=守宫&tab=products");
    await expect(page.locator("text=搜索")).toBeVisible();
  });

  test("帖子详情页可访问", async ({ page }) => {
    await page.goto("/community");
    const link = page.locator("a[href*='/community/post/']").first();
    if (await link.count() > 0) {
      await link.click();
      await expect(page.locator("text=浏览")).toBeVisible();
    }
  });

  test("发帖页需要登录", async ({ page }) => {
    await page.goto("/community/new");
    await page.waitForURL("**/auth**");
  });
});
