import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthPage from "@/app/auth/page";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthPage 登录/注册页面", () => {
  it("默认显示登录模式，包含邮箱和密码输入框", () => {
    render(<AuthPage />);
    expect(screen.getAllByText("登录")).toHaveLength(2); // Tab按钮 + 提交按钮
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("至少 6 位密码")).toBeInTheDocument();
  });

  it("点击注册 Tab 切换到注册模式，显示用户名字段", async () => {
    const user = userEvent.setup();
    render(<AuthPage />);
    await user.click(screen.getByRole("button", { name: "注册" }));
    expect(screen.getByPlaceholderText("请输入用户名")).toBeInTheDocument();
  });

  it("登录模式下不显示用户名输入框", () => {
    render(<AuthPage />);
    expect(
      screen.queryByPlaceholderText("请输入用户名")
    ).not.toBeInTheDocument();
  });

  it("邮箱为空时提交表单应显示原生验证", () => {
    render(<AuthPage />);
    const emailInput = screen.getByPlaceholderText("your@email.com");
    expect(emailInput).toBeRequired();
  });

  it("密码字段最小长度为 6", () => {
    render(<AuthPage />);
    const passwordInput = screen.getByPlaceholderText("至少 6 位密码");
    expect(passwordInput).toHaveAttribute("minLength", "6");
  });

  it("显示页面标题", () => {
    render(<AuthPage />);
    expect(screen.getByText("宠物交易平台")).toBeInTheDocument();
  });
});
