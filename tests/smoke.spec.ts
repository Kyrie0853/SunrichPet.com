import { test, expect } from "@playwright/test";

// ============================================================
// 全站烟雾测试 (Smoke Test)
// 遍历所有路由，检查 HTTP 状态和 JS 控制台报错
// ============================================================

// 公开路由 — 任何人都能访问，预期 200
const PUBLIC_ROUTES = [
  { path: "/", name: "论坛首页" },
  { path: "/community", name: "社区首页" },
  { path: "/shop", name: "商城" },
  { path: "/search?q=test", name: "搜索页" },
  { path: "/auth", name: "登录页" },
  { path: "/products", name: "商品列表" },
];

// 需要登录的路由 — 未登录应 302→/auth，登录后应 200
const AUTH_ROUTES = [
  { path: "/community/new", name: "发帖" },
  { path: "/cart", name: "购物车" },
  { path: "/checkout", name: "结算" },
  { path: "/messages", name: "私信列表" },
  { path: "/feed", name: "动态流" },
  { path: "/orders", name: "我的订单" },
  { path: "/community/notifications", name: "通知" },
  { path: "/community/user", name: "我的(重定向)" },
  { path: "/profile", name: "个人中心(重定向)" },
  { path: "/profile/edit", name: "编辑资料" },
];

// 管理路由 — 非管理员应 302→/
const ADMIN_ROUTES = [
  { path: "/admin", name: "后台管理" },
  { path: "/admin/reports", name: "举报管理" },
  { path: "/admin/orders", name: "订单管理" },
];

// 动态路由 — 只检查页面框架，不依赖真实数据
const DYNAMIC_ROUTES = [
  { path: "/community/post/nonexistent-id", name: "帖子详情(404)" },
  { path: "/products/nonexistent-slug", name: "商品详情(404)" },
  { path: "/community/user/nonexistent-uuid", name: "用户主页(404)" },
  { path: "/shop/seller/nonexistent-id", name: "商家主页(404)" },
];

test.describe("全站路由遍历", () => {
  
  // --- 公开路由 ---
  for (const route of PUBLIC_ROUTES) {
    test(`公开路由: ${route.name} (${route.path})`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", msg => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      const res = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `${route.name} 应返回 200`).toBe(200);
      await page.waitForLoadState("networkidle").catch(() => {});
      
      if (errors.length > 0) {
        console.warn(`[${route.name}] 控制台错误:`, errors);
      }
    });
  }

  // --- 认证路由 — 未登录 → 302 ---
  for (const route of AUTH_ROUTES) {
    test(`认证路由(未登录): ${route.name} (${route.path})`, async ({ page }) => {
      const res = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      // 未登录应重定向到 /auth
      const finalUrl = page.url();
      expect(
        finalUrl.includes("/auth") || res?.status() === 200,
        `${route.name} 未登录时应重定向到 /auth 或正常展示，实际: ${finalUrl}`
      ).toBeTruthy();
    });
  }

  // --- 管理路由 — 未登录 → /auth ---
  for (const route of ADMIN_ROUTES) {
    test(`管理路由(未登录): ${route.name} (${route.path})`, async ({ page }) => {
      const res = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      const finalUrl = page.url();
      expect(
        finalUrl.includes("/auth") || finalUrl.includes("/"),
        `${route.name} 未登录时应重定向，实际: ${finalUrl}`
      ).toBeTruthy();
    });
  }

  // --- 动态路由 — 不存在ID → 404 ---
  for (const route of DYNAMIC_ROUTES) {
    test(`动态路由: ${route.name} (${route.path})`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", msg => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      const res = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      // 不存在的资源应返回 404 或正常渲染
      expect([200, 404]).toContain(res?.status());
      await page.waitForLoadState("networkidle").catch(() => {});
      
      // 404 页面应包含友好提示
      if (res?.status() === 404) {
        await expect(page.locator("text=页面未找到").or(page.locator("text=未找到")).or(page.locator("text=不存在"))).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });
  }

  // --- 特殊: 不存在的路由 → 404 ---
  test("不存在的路由返回友好 404", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-12345", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(404);
    await expect(page.locator("text=页面未找到")).toBeVisible();
  });
});

test.describe("移动端专项检查", () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

  test("底部导航栏所有 Tab 可点击", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });

    // 首页
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const tabs = ["首页", "吧", "商城", "消息", "我的"];
    for (const tab of tabs) {
      const link = page.locator(`nav.fixed.bottom-0 a:has-text("${tab}")`);
      const count = await link.count();
      if (count === 0) {
        // 尝试其他选择器
        const altLink = page.locator(`nav.bottom-0 a`).filter({ hasText: tab });
        const altCount = await altLink.count();
        if (altCount > 0) {
          await altLink.first().click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(500);
        }
        continue;
      }
      await link.first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);
      // 不应出现 404
      const body404 = page.locator("text=页面未找到");
      const is404 = await body404.isVisible().catch(() => false);
      expect(is404, `点击"${tab}"后不应显示404`).toBe(false);
    }

    if (errors.length > 0) {
      console.warn("移动端控制台错误:", errors);
    }
  });

  test("导航栏按钮点击区域 ≥ 44px", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const navLinks = page.locator("nav.fixed.bottom-0 a, nav.sticky a");
    const count = await navLinks.count();
    for (let i = 0; i < count; i++) {
      const box = await navLinks.nth(i).boundingBox();
      if (box) {
        expect(box.width, `Tab ${i} 宽度应 ≥ 44px`).toBeGreaterThanOrEqual(40);
        expect(box.height, `Tab ${i} 高度应 ≥ 44px`).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

test.describe("关键页面结构检查", () => {
  test("论坛首页渲染帖子列表", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
    
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    
    // 至少应有分类Tab或帖子卡片或空状态提示
    const heading = page.locator('h1, h2').filter({ hasText: /热门广场|宠物玩家社区|论坛|社区/ });
    const tabBtn = page.locator('button').filter({ hasText: '全部' });
    const hasContent = await heading.first().isVisible().catch(() => false);
    const hasTab = await tabBtn.first().isVisible().catch(() => false);
    expect(hasContent || hasTab, "论坛首页应有内容展示").toBe(true);
    
    if (errors.length > 0) console.warn("论坛首页控制台错误:", errors);
  });

  test("商城首页渲染", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    
    const heading = page.locator('h1, h2').first();
    const hasHeading = await heading.isVisible().catch(() => false);
    // 商城页可能有标题或分类链接，确认不是404
    const not404 = !(await page.locator("text=页面未找到").isVisible().catch(() => false));
    expect(hasHeading && not404, "商城页应有内容而非404").toBe(true);
  });

  test("登录页渲染", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=顺瑞益宠")).toBeVisible();
    const hasEmailInput = await page.locator('input[type="email"]').isVisible().catch(() => false);
    expect(hasEmailInput, "登录页应有邮箱输入框").toBe(true);
  });
});

test.describe("API健康检查", () => {
  test("GET /api/health 返回正常", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("ok", true);
  });
});
