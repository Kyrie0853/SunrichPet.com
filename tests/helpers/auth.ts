import { Page } from "@playwright/test";

const TEST_EMAIL = `test_${Date.now()}@sunrich.test`;
const TEST_PASSWORD = "test123456";
const TEST_NAME = "测试用户";

export async function register(page: Page, email = TEST_EMAIL) {
  await page.goto("/auth");
  await page.locator("input[type=email]").fill(email);
  await page.locator("button[type=submit]").click();
  // 如果有验证码步骤，跳过
  await page.waitForTimeout(500);
}

export async function loginWithOTP(page: Page) {
  await page.goto("/auth");
  await page.locator("input[type=email]").fill(TEST_EMAIL);
  await page.locator("button[type=submit]").click();
}

export async function ensureLoggedIn(page: Page) {
  // 检查是否已登录
  await page.goto("/");
  const loggedIn = await page.locator("text=登录").count();
  if (loggedIn > 0) {
    await page.goto("/auth");
    await page.locator("input[type=email]").fill("admin@sunrich.test");
    const passwordLink = page.locator("text=使用密码登录");
    if (await passwordLink.count() > 0) await passwordLink.click();
    await page.locator("input[type=password]").fill("admin123");
    await page.locator("button[type=submit]").click();
    await page.waitForURL("**/");
  }
}

export { TEST_EMAIL, TEST_PASSWORD, TEST_NAME };
