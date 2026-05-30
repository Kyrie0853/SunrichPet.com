import { test, expect } from "@playwright/test";

test.describe("用户认证", () => {
  test("登录页面可以正常加载", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("text=顺瑞益宠")).toBeVisible();
    await expect(page.locator("input[type=email]")).toBeVisible();
  });

  test("未登录访问需登录页面自动跳转", async ({ page }) => {
    await page.goto("/community/new");
    await page.waitForURL("**/auth**");
    await expect(page.locator("input[type=email]")).toBeVisible();
  });

  test("未登录访问私信跳转登录页", async ({ page }) => {
    await page.goto("/messages");
    await page.waitForURL("**/auth**");
    await expect(page.locator("input[type=email]")).toBeVisible();
  });

  test("未登录访问下单跳转登录页", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForURL("**/auth**");
  });

  test("导航栏显示登录按钮（未登录状态）", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=登录")).toBeVisible();
  });

  test("密码登录表单包含邮箱和密码输入框", async ({ page }) => {
    await page.goto("/auth");
    await page.locator("text=使用密码登录").click();
    await page.waitForTimeout(300);
    await expect(page.locator("input[type=email]")).toBeVisible();
    await expect(page.locator("input[type=password]")).toBeVisible();
    await expect(page.locator("button[type=submit]")).toBeVisible();
  });

  test("忘记密码跳转到邮箱验证步骤", async ({ page }) => {
    await page.goto("/auth");
    await page.locator("text=使用密码登录").click();
    await page.waitForTimeout(300);
    await page.locator("text=忘记密码").click();
    await page.waitForTimeout(300);
    await expect(page.locator("input[type=email]")).toBeVisible();
    await expect(page.locator("text=发送验证码")).toBeVisible();
  });

  test("个人资料编辑页需要登录", async ({ page }) => {
    await page.goto("/profile/edit");
    await page.waitForURL("**/auth**");
  });
});
