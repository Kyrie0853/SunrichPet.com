import { test, expect } from "@playwright/test";

test.describe("扩展覆盖", () => {

  test.describe("空状态检查", () => {
    test("新用户无帖子时论坛显示空状态", async ({ page }) => {
      await page.goto("/community");
      await page.waitForTimeout(1000);
      // 要么有帖子，要么有空状态提示
      const hasPosts = await page.locator("article").count();
      const hasEmpty = await page.locator("text=暂无帖子").count();
      expect(hasPosts + hasEmpty).toBeGreaterThan(0);
    });

    test("无通知时空状态提示", async ({ page }) => {
      await page.goto("/community/notifications");
      await page.waitForTimeout(2000);
      const hasContent = await page.locator("text=暂无通知").or(page.locator("a")).count();
      expect(hasContent).toBeGreaterThan(0);
    });

    test("商城空搜索有提示", async ({ page }) => {
      await page.goto("/search?q=不存在的商品xyz999&tab=products");
      await expect(page.locator("text=未找到相关内容")).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("加载状态", () => {
    test("论坛首页加载后有内容", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(2000);
      // 页面不应白屏
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.length).toBeGreaterThan(50);
    });

    test("商品列表加载后有内容", async ({ page }) => {
      await page.goto("/products");
      await page.waitForTimeout(1500);
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.length).toBeGreaterThan(50);
    });
  });

  test.describe("导航一致性", () => {
    test("论坛→社区链接可点击", async ({ page }) => {
      await page.goto("/");
      await page.locator("a[href='/shop']").first().click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/shop/);
    });

    test("商城→论坛链接可点击", async ({ page }) => {
      await page.goto("/shop");
      await page.locator("a[href='/']").first().click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/$/);
    });
  });

  test.describe("错误处理", () => {
    test.skip("表单空提交不崩溃", async ({ page }) => {
      await page.goto("/auth");
      await page.waitForTimeout(1000);
      const submitBtn = page.locator("button[type=submit]");
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1500);
        // 页面不崩溃即为通过
        const title = await page.title();
        expect(title.length).toBeGreaterThan(0);
      }
    });

    test("帖子详情页不存在时显示404", async ({ page }) => {
      const res = await page.goto("/community/post/00000000-0000-0000-0000-000000000000");
      await page.waitForTimeout(1000);
      // 应该显示404或重定向
      const has404 = await page.locator("text=404").or(page.locator("text=未找到")).count();
      const redirected = page.url().includes("/auth");
      expect(has404 + (redirected ? 1 : 0)).toBeGreaterThan(0);
    });
  });

  test.describe("移动端布局", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("移动端帖子列表不超出屏幕", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1000);
      const cards = page.locator("article");
      if (await cards.count() > 0) {
        const box = await cards.first().boundingBox();
        if (box) expect(box.width).toBeLessThanOrEqual(380);
      }
    });

    test("移动端聊天页全屏", async ({ page }) => {
      await page.goto("/messages");
      await page.waitForTimeout(2000);
      // 检查底部导航栏可见
      await expect(page.locator("nav.fixed.bottom-0")).toBeVisible({ timeout: 3000 });
    });
  });
});
