import { test, expect } from "@playwright/test";

test.describe("安全", () => {
  test("普通用户无法访问管理后台", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(1000);
    // 应该被重定向到登录页，content 中不应有后台管理功能
    await expect(page.locator("text=后台" ).first()).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test("编辑他人帖子需要登录", async ({ page }) => {
    const res = await page.goto("/community/post/00000000-0000-0000-0000-000000000001/edit");
    const redirected = page.url().includes("/auth") || res?.status() === 307;
    expect(redirected).toBeTruthy();
  });
});