import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

// Mock Next.js Link（使用 createElement 避免 JSX 解析问题）
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: any;
  }) => {
    const { className, ...rest } = props;
    return React.createElement("a", { href, className, ...rest }, children);
  },
}));

// Mock Supabase browser client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    insert: vi.fn().mockReturnThis(),
  })),
}));

// Mock Server Actions
vi.mock("@/app/actions/cart", () => ({
  addToCart: vi.fn().mockResolvedValue({ success: true, message: "已加入购物车" }),
  updateCartItem: vi.fn().mockResolvedValue({ success: true, message: "已更新" }),
  removeCartItem: vi.fn().mockResolvedValue({ success: true, message: "已删除" }),
  checkout: vi.fn().mockResolvedValue({
    success: true,
    message: "下单成功",
    orderId: "order-test-123",
  }),
}));

vi.mock("@/app/actions/admin", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));
