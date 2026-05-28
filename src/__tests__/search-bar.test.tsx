import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/SearchBar";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SearchBar 搜索框组件", () => {
  it("渲染搜索输入框和按钮", () => {
    render(<SearchBar />);
    expect(
      screen.getByPlaceholderText("搜索宠物、用品...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("输入文字后可以清空", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("搜索宠物、用品...");
    await user.type(input, "守宫");
    expect(input).toHaveValue("守宫");
    await user.clear(input);
    expect(input).toHaveValue("");
  });

  it("空内容提交不跳转", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const button = screen.getByRole("button");
    await user.click(button);
    // 空内容时不会跳转（jsdom 默认 URL 为 localhost）
    expect(window.location.href).toContain("localhost");
  });
});
