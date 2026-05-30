import { test, expect } from "@playwright/test";

test.describe("安全", () => {
  test("普通用户无法访问管理后台", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(1000);
    // 未登录用户应该被重定向或显示404
    const url = page.url();
    expect(url.includes("/admin")).toBeFalsy();
  });

  test("普通用户无法访问举报管理", async ({ page }) => {
    await page.goto("/admin/reports");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/admin")).toBeFalsy();
  });

  test("普通用户无法访问订单管理", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/admin")).toBeFalsy();
  });

  test("编辑帖子页需要登录", async ({ page }) => {
    await page.goto("/community/post/00000000-0000-0000-0000-000000000001/edit");
    await page.waitForURL("**/auth**");
  });
});
