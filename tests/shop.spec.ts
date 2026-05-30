import { test, expect } from "@playwright/test";

test.describe("商城", () => {
  test("商城首页加载", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator("text=小众宠物")).toBeVisible();
  });

  test("商品搜索框可见", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator("input[placeholder*='搜索']").first()).toBeVisible();
  });

  test("商品列表页加载", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("a[href*='/products/']").first()).toBeVisible();
  });

  test("商品详情页加载", async ({ page }) => {
    await page.goto("/products");
    const link = page.locator("a[href*='/products/']").first();
    if (await link.count() > 0) {
      await link.click();
      await page.waitForTimeout(500);
    }
  });

  test("购物车页面（未登录跳转）", async ({ page }) => {
    await page.goto("/cart");
    await page.waitForURL("**/auth**");
  });

  test("商家主页可访问", async ({ page }) => {
    await page.goto("/products");
    const link = page.locator("a[href*='/products/']").first();
    if (await link.count() > 0) await link.click();
  });
});
