# 顺瑞益宠 UI 设计规范 v2.0

> 核心哲学：简约 · 干净 · 顺手 · 高级

---

## 一、色彩体系

### 品牌色
| Token | 色值 | 用途 |
|-------|------|------|
| `--brand` | `#1a7f5a` | 主按钮、链接、当前标签、品牌标识 |
| `--brand-light` | `#e8f5ef` | 品牌色浅底（标签背景、选中态） |
| `--brand-hover` | `#166b4b` | 按钮悬停加深 |

### 强调色
| Token | 色值 | 用途 |
|-------|------|------|
| `--accent` | `#f0a04b` | 未读红点、促销标签、收藏星标 |
| `--danger` | `#dc3545` | 删除操作、错误提示（仅文字/边框，不用大面积底色） |
| `--danger-light` | `#fef2f2` | 危险操作浅底 |

### 中性色
| Token | 色值 | 用途 |
|-------|------|------|
| `--bg-page` | `#f8f9fa` | 页面背景 |
| `--bg-card` | `#ffffff` | 卡片背景 |
| `--bg-input` | `#f9fafb` | 输入框背景 |
| `--bg-hover` | `#f3f4f6` | 悬停/选中背景 |
| `--text-primary` | `#1f2937` | 主文字（标题、正文） |
| `--text-secondary` | `#6b7280` | 辅助文字（时间、元信息） |
| `--text-disabled` | `#9ca3af` | 禁用/占位文字 |
| `--border` | `#e5e7eb` | 边框线 |
| `--border-light` | `#f3f4f6` | 极浅分割线 |

---

## 二、字体层级

使用系统默认字体栈，确保各平台显示一致：

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

| 层级 | 字号 | 字重 | 行高 | 用途 |
|------|------|:---:|:---:|------|
| H1 页面标题 | 24px / 1.5rem | 600 | 1.4 | 页面顶部大标题 |
| H2 区块标题 | 20px / 1.25rem | 600 | 1.4 | 卡片标题、区块名 |
| H3 子标题 | 18px / 1.125rem | 600 | 1.4 | 列表项标题 |
| Body 正文 | 15px / 0.9375rem | 400 | 1.6 | 帖子内容、描述文字 |
| Small 辅助 | 13px / 0.8125rem | 400 | 1.5 | 时间、元信息、标签 |
| Caption | 12px / 0.75rem | 400 | 1.4 | 极小提示 |

---

## 三、间距与留白

**基础单位: 8px**，所有内外边距为 8 的倍数。

| 名称 | 值 | Tailwind | 用途 |
|------|------|----------|------|
| xs | 4px | `p-0.5` / `gap-0.5` | 图标与文字间距 |
| sm | 8px | `p-1` / `gap-1` | 紧凑元素间距 |
| md | 12px | `p-1.5` / `gap-1.5` | 标签间距 |
| base | 16px | `p-2` / `gap-2` | 卡片内边距、列表间距 |
| lg | 24px | `p-3` / `gap-3` | 区块间距 |
| xl | 32px | `p-4` / `gap-4` | 大区块间距 |
| 2xl | 48px | `p-6` | 页面顶部/底部留白 |

**布局约束**:
- 页面内容最大宽度: `1200px` (`max-w-6xl`)
- 两侧最小留白: `24px` (`px-6` 或 `px-3 md:px-6`)

---

## 四、圆角规范

| 组件 | 圆角 | Tailwind |
|------|------|----------|
| 页面级卡片（帖子、商品、用户卡片） | 12px | `rounded-xl` |
| 小部件（输入框、标签、下拉菜单） | 8px | `rounded-lg` |
| 头像、按钮、徽章 | 全圆 | `rounded-full` |
| 弹窗/对话框 | 16px | `rounded-2xl` |

---

## 五、阴影规范

不使用彩色阴影或过大阴影，保持克制。

| 状态 | 阴影 | Tailwind |
|------|------|----------|
| 默认卡片 | `0 1px 2px rgba(0,0,0,0.04)` | `shadow-sm` |
| 悬停卡片 | `0 4px 12px rgba(0,0,0,0.06)` | `shadow-md` |
| 导航栏 | `0 1px 3px rgba(0,0,0,0.04)` | `shadow-sm` |
| 弹窗/下拉 | `0 8px 24px rgba(0,0,0,0.08)` | `shadow-lg` |
| FAB 浮动按钮 | `0 4px 12px rgba(26,127,90,0.25)` | 品牌色阴影 |

---

## 六、过渡动画

所有可交互元素统一：

```css
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

| 交互 | 效果 | Tailwind |
|------|------|----------|
| 悬停卡片/按钮 | 上浮 2px + 阴影加深 | `hover:-translate-y-0.5 hover:shadow-md` |
| 点击 | 缩小至 98% | `active:scale-[0.98]` |
| 悬停链接 | 颜色过渡到品牌绿 | `hover:text-[#1a7f5a]` |
| 悬停头像 | 2px 品牌绿环形边框 | `hover:ring-2 hover:ring-[#1a7f5a]/30` |

---

## 七、组件规范速查

### 按钮
```
主按钮:  bg-[#1a7f5a] text-white rounded-full px-5 py-2.5 text-sm font-medium
次按钮:  border border-[#1a7f5a] text-[#1a7f5a] rounded-full px-5 py-2.5 text-sm
文字按钮: text-gray-500 hover:text-[#1a7f5a] text-sm
危险按钮: text-red-500 hover:bg-red-50 rounded-lg px-3 py-1.5 text-sm
```

### 输入框
```
height: 44px (h-11)
rounded: rounded-lg
bg: bg-gray-50 → focus:bg-white
border: border-gray-200 → focus:border-[#1a7f5a] focus:ring-1 focus:ring-[#1a7f5a]/20
placeholder: placeholder-gray-400
```

### 头像
```
sm: 32px | md: 40px | lg: 64px | xl: 96px
可点击: hover:ring-2 hover:ring-offset-2 hover:ring-[#1a7f5a]/20
fallback: 品牌绿渐变 bg-gradient-to-br from-emerald-400 to-emerald-600
```

### 卡片
```
bg-white rounded-xl shadow-sm p-4
hover: -translate-y-0.5 shadow-md
```

---

*最后更新: 2026-05-31 — v2.0 设计规范*
