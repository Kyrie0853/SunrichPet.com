import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/ProductCard";

const mockProduct = {
  id: "test-uuid",
  slug: "high-yellow-leopard-gecko",
  name: "高黄豹纹守宫",
  price: 298,
  image_url: null,
  stock: 5,
};

describe("ProductCard 商品卡片", () => {
  it("渲染商品名称、价格和图片占位", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("高黄豹纹守宫")).toBeInTheDocument();
    expect(screen.getByText("¥298")).toBeInTheDocument();
    // 无图片时显示首字占位
    expect(screen.getByText("高")).toBeInTheDocument();
  });

  it("链接指向正确的商品详情页", () => {
    render(<ProductCard product={mockProduct} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/products/high-yellow-leopard-gecko"
    );
  });

  it("库存为 0 时显示售罄标签", () => {
    render(<ProductCard product={{ ...mockProduct, stock: 0 }} />);
    expect(screen.getByText("已售罄")).toBeInTheDocument();
  });

  it("有图片时渲染图片", () => {
    render(
      <ProductCard
        product={{ ...mockProduct, image_url: "https://example.com/img.jpg" }}
      />
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/img.jpg");
    expect(img).toHaveAttribute("alt", "高黄豹纹守宫");
  });
});
