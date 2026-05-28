import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "@/components/admin/ProductForm";

const mockCategories = [
  { id: "cat-1", name: "守宫", slug: "gecko" },
  { id: "cat-2", name: "蛇类", slug: "snake" },
];

const mockOnSuccess = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductForm 商品表单", () => {
  it("添加模式：渲染空表单", () => {
    render(
      <ProductForm
        categories={mockCategories}
        product={null}
        onSuccess={mockOnSuccess}
      />
    );
    expect(screen.getByPlaceholderText("例：高黄豹纹守宫")).toBeInTheDocument();
    expect(screen.getByText("添加商品")).toBeInTheDocument();
    expect(screen.getByText("添加商品")).toBeTruthy(); // submit button
  });

  it("编辑模式：预填现有数据", () => {
    const existingProduct = {
      id: "prod-1",
      name: "高黄豹纹守宫",
      slug: "high-yellow",
      description: "经典品系",
      price: 298,
      stock: 5,
      image_url: "https://example.com/img.jpg",
      status: "active",
      category_id: "cat-1",
      created_at: "2026-01-01",
    };
    render(
      <ProductForm
        categories={mockCategories}
        product={existingProduct}
        onSuccess={mockOnSuccess}
      />
    );
    const nameInput = screen.getByPlaceholderText("例：高黄豹纹守宫");
    expect(nameInput).toHaveValue("高黄豹纹守宫");
    expect(screen.getByText("保存修改")).toBeInTheDocument();
    // 现有图片预览
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/img.jpg");
  });

  it("必填字段有标记", () => {
    render(
      <ProductForm
        categories={mockCategories}
        product={null}
        onSuccess={mockOnSuccess}
      />
    );
    const requiredMarks = screen.getAllByText("*");
    expect(requiredMarks.length).toBeGreaterThanOrEqual(3); // 名称、分类、价格、库存
  });

  it("渲染分类下拉选项", () => {
    render(
      <ProductForm
        categories={mockCategories}
        product={null}
        onSuccess={mockOnSuccess}
      />
    );
    expect(screen.getByText("守宫")).toBeInTheDocument();
    expect(screen.getByText("蛇类")).toBeInTheDocument();
  });

  it("显示状态选择（上架/下架）", () => {
    render(
      <ProductForm
        categories={mockCategories}
        product={null}
        onSuccess={mockOnSuccess}
      />
    );
    expect(screen.getByText("上架")).toBeInTheDocument();
    expect(screen.getByText("下架")).toBeInTheDocument();
  });

  it("显示图片上传提示", () => {
    render(
      <ProductForm
        categories={mockCategories}
        product={null}
        onSuccess={mockOnSuccess}
      />
    );
    expect(
      screen.getByText("支持 JPG/PNG/WebP/AVIF，最大 5MB")
    ).toBeInTheDocument();
  });
});
