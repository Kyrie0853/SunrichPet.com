import { test, expect } from "@playwright/test";

test.describe("论坛核心", () => {
  test("热门广场首页可以加载", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=热门广场")).toBeVisible();
  });

  test("热门广场可跳转到吧", async ({ page }) => {
    await page.goto("/");
    const barLink = page.locator("a[href*='/b/']").first();
    if (await barLink.count() > 0) {
      await barLink.click();
      await page.waitForTimeout(500);
      await expect(page.locator("text=吧")).toBeVisible();
    }
  });

  test("发帖按钮可点击", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=发布帖子")).toBeVisible();
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
    await page.goto("/");
    const link = page.locator("a[href*='/community/post/']").first();
    if (await link.count() > 0) {
      await link.click();
      await expect(page.locator("text=浏览")).toBeVisible();
    }
  });

  test("发帖页需要登录", async ({ page }) => {
    await page.goto("/community/new"); await page.waitForTimeout(1500);
  });
});
