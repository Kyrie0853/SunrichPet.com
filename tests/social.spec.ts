import { test, expect } from "@playwright/test";

test.describe("社交功能", () => {
  test("用户主页可访问", async ({ page }) => {
    await page.goto("/community");
    const userLink = page.locator("a[href*='/community/user/']").first();
    if (await userLink.count() > 0) {
      await userLink.click();
      await expect(page.locator("text=关注")).toBeVisible();
    }
  });

  test("动态流页面需要登录", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForURL("**/auth**");
  });

  test("私信页面需要登录", async ({ page }) => {
    await page.goto("/messages");
    await page.waitForURL("**/auth**");
  });

  test("通知页面需要登录", async ({ page }) => {
    await page.goto("/community/notifications");
    await page.waitForURL("**/auth**");
  });
});
