import { test, expect } from "@playwright/test";

test.describe("用户认证", () => {
  test("登录页面可以正常加载", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("text=顺瑞益宠")).toBeVisible();
    await expect(page.locator("input[type=email]")).toBeVisible();
  });

  test.fixme("未登录访问需登录页面被拦截（Next.js dev mode redirect 差异）", async ({ page }) => {
    const res = await page.goto("/community/new");
    // 要么跳转到登录页，要么返回 307 重定向
    const redirected = page.url().includes("/auth") || res?.status() === 307 || res?.status() === 303;
    expect(redirected).toBeTruthy();
  });

  test("未登录访问私信被拦截", async ({ page }) => {
    const res = await page.goto("/messages");
    const redirected = page.url().includes("/auth") || res?.status() === 307 || res?.status() === 303;
    expect(redirected).toBeTruthy();
  });

  test("未登录访问下单被拦截", async ({ page }) => {
    const res = await page.goto("/checkout");
    const redirected = page.url().includes("/auth") || res?.status() === 307 || res?.status() === 303;
    expect(redirected).toBeTruthy();
  });

  test("导航栏显示登录按钮（未登录状态）", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("登录").first()).toBeVisible();
  });

  test("密码登录表单包含邮箱和密码输入框", async ({ page }) => {
    await page.goto("/auth");
    const pwBtn = page.getByText("使用密码登录").first();
    await pwBtn.waitFor({ state: "visible" });
    await pwBtn.click();
    await page.waitForTimeout(500);
    const pwInput = page.locator("input[type=password]");
    await expect(pwInput).toBeVisible({ timeout: 5000 });
  });

  test("忘记密码跳转到邮箱验证步骤", async ({ page }) => {
    await page.goto("/auth");
    await page.getByText("使用密码登录").first().click();
    await page.waitForTimeout(500);
    await page.getByText("忘记密码").click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=发送验证码")).toBeVisible({ timeout: 5000 });
  });

  test("个人资料编辑页需要登录", async ({ page }) => {
    const res = await page.goto("/profile/edit");
    const redirected = page.url().includes("/auth") || res?.status() === 307;
    expect(redirected).toBeTruthy();
  });
});
