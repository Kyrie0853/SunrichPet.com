# 自动化测试文档

## 快速开始

```bash
npx playwright install chromium
npx playwright test
```

## 运行特定测试

```bash
npx playwright test tests/auth.spec.ts
npx playwright test --project=mobile
npx playwright test --ui
npx playwright show-report tests/report
```

## 测试结构

tests/auth.spec.ts    — 用户认证
tests/forum.spec.ts   — 论坛核心
tests/shop.spec.ts    — 商城
tests/social.spec.ts  — 社交功能
tests/security.spec.ts — 安全测试
tests/mobile.spec.ts  — 移动端适配
tests/helpers/auth.ts — 辅助函数
