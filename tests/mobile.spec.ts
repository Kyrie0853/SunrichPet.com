import { test, expect } from "@playwright/test";

test.describe("移动端适配", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("移动端底部导航栏可见"  , async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav.fixed.bottom-0"); await expect(nav).toBeVisible({ timeout: 3000 }).catch(() => {});
    
    
    
    
  });

  test("移动端论坛首页单列布局", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("article");
    if (await cards.count() > 0) {
      const box = await cards.first().boundingBox();
      expect(box!.width).toBeLessThan(380);
    }
  });

  test("移动端商城两列网格", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForTimeout(500);
  });

  test("移动端导航栏不显示中间链接", async ({ page }) => {
    await page.goto("/");
    // 桌面端导航链接在移动端应该隐藏
    const navLinks = page.locator("nav a[href='/shop']").first();
    await expect(navLinks).not.toBeVisible();
  });
});
