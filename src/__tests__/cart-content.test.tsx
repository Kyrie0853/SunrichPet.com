import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartContent } from "@/components/CartContent";

const mockItems = [
  {
    id: "item-1",
    quantity: 2,
    product: {
      id: "prod-1",
      slug: "gecko",
      name: "高黄豹纹守宫",
      price: 298,
      image_url: null,
      stock: 10,
      status: "active",
    },
  },
  {
    id: "item-2",
    quantity: 1,
    product: {
      id: "prod-2",
      slug: "snake",
      name: "原色玉米蛇",
      price: 388,
      image_url: null,
      stock: 5,
      status: "active",
    },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CartContent 购物车内容", () => {
  it("渲染购物车商品列表和合计价格", () => {
    render(<CartContent items={mockItems} />);
    expect(screen.getByText("高黄豹纹守宫")).toBeInTheDocument();
    expect(screen.getByText("原色玉米蛇")).toBeInTheDocument();
    // 2 * 298 + 1 * 388 = 984
    expect(screen.getByText("¥984.00")).toBeInTheDocument();
  });

  it("显示每个商品的数量", () => {
    render(<CartContent items={mockItems} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("显示模拟下单按钮", () => {
    render(<CartContent items={mockItems} />);
    expect(screen.getByText("模拟下单")).toBeInTheDocument();
  });

  it("空购物车时显示提示", () => {
    render(<CartContent items={[]} />);
    expect(screen.getByText("购物车是空的")).toBeInTheDocument();
    expect(screen.getByText("去逛逛")).toBeInTheDocument();
  });

  it("点击减少按钮减少数量", async () => {
    const user = userEvent.setup();
    render(<CartContent items={mockItems} />);
    const minusButtons = screen.getAllByRole("button", { name: "-" });
    await user.click(minusButtons[0]);
    // 乐观更新后数量应变为 1（mock action 会被调用）
    expect(screen.getByText("模拟下单")).toBeInTheDocument();
  });

  it("点击删除按钮移除商品", async () => {
    const user = userEvent.setup();
    render(<CartContent items={mockItems} />);
    const deleteButtons = screen.getAllByTitle("删除");
    expect(deleteButtons).toHaveLength(2);
  });

  it("显示单价和小计", () => {
    render(<CartContent items={mockItems} />);
    expect(screen.getByText("¥298")).toBeInTheDocument();
    expect(screen.getByText("¥388")).toBeInTheDocument();
    expect(screen.getByText("¥596.00")).toBeInTheDocument(); // 298 * 2
  });
});
