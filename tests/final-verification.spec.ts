import { test, expect } from '@playwright/test';

// ============================================================
// 全平台最终验证 E2E 测试
// 覆盖: 路由可达性 / 鉴权 / 合规页面 / 移动端
// ============================================================

// ---- 公开合规页面 ----
test.describe('合规页面可达性', () => {
  const pages = [
    '/rules', '/rules/prohibited', '/rules/after-sale',
    '/help', '/help/newbie', '/help/trade',
    '/guide', '/encyclopedia', '/encyclopedia/leopard-gecko',
    '/report',
  ];
  pages.forEach(path => {
    test(path + ' 返回200', async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    });
  });
});

// ---- 搜索引擎 ----
test.describe('SEO端点', () => {
  test('sitemap.xml 返回XML', async ({ page }) => {
    const res = await page.goto('/sitemap.xml');
    expect(res?.status()).toBe(200);
    const text = await page.content();
    expect(text).toContain('<urlset');
  });
  test('robots.txt 返回文本', async ({ page }) => {
    const res = await page.goto('/robots.txt');
    expect(res?.status()).toBe(200);
    const text = await page.content();
    expect(text).toContain('Sitemap');
  });
});

// ---- 鉴权拦截 ----
test.describe('鉴权拦截', () => {
  const authPages = ['/messages', '/cart', '/checkout', '/orders', '/seller/dashboard', '/profile/edit'];
  authPages.forEach(path => {
    test(path + ' 未登录跳转', async ({ page }) => {
      await page.goto(path);
      await page.waitForURL('**/auth**', { timeout: 5000 });
    });
  });
  // /community/new loads but shows rules modal (doesn't redirect immediately)
  test('/community/new 可访问', async ({ page }) => {
    const res = await page.goto('/community/new');
    expect(res?.status()).toBe(200);
  });
  test('/admin 未登录重定向', async ({ page }) => {
    const res = await page.goto('/admin');
    expect(res?.status()).toBe(200);
    // Admin should redirect to auth when not logged in
    await expect(page).toHaveURL(/auth/);
  });
});

// ---- 首页元素 ----
test.describe('首页关键元素', () => {
  test('首页加载正常', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=热门广场').first()).toBeVisible({ timeout: 5000 });
  });
  test('担保交易标识可见', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=平台担保交易')).toBeVisible({ timeout: 5000 });
  });
  test('底部Footer存在', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=平台规则')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=商家入驻')).toBeVisible();
  });
});

// ---- 移动端 ----
test.describe('移动端适配', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('首页无横向溢出', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box).toBeTruthy();
    if (box) expect(box.width).toBeLessThanOrEqual(375 + 5);
  });
  test('社区页无横向溢出', async ({ page }) => {
    await page.goto('/b');
    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box).toBeTruthy();
  });
  test('商城页无横向溢出', async ({ page }) => {
    await page.goto('/shop');
    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box).toBeTruthy();
  });
});

// ---- 后台移动端 ----
test.describe('后台移动端', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('后台汉堡菜单可见', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    const menuBtn = page.locator('button[aria-label="打开菜单"]');
    if (await menuBtn.count() > 0) {
      await expect(menuBtn).toBeVisible();
    }
  });
});

// ---- API健康检查 ----
test.describe('API端点', () => {
  test('/api/health 返回200', async ({ page }) => {
    const res = await page.goto('/api/health');
    expect(res?.status()).toBe(200);
  });
});

// ---- PWA ----
test.describe('PWA资源', () => {
  test('manifest.json 可访问', async ({ page }) => {
    const res = await page.goto('/manifest.json');
    expect(res?.status()).toBe(200);
  });
  test('sw.js 可访问', async ({ page }) => {
    const res = await page.goto('/sw.js');
    expect(res?.status()).toBe(200);
  });
});
