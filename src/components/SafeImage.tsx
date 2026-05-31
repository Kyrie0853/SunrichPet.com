"use client";

import { useState } from "react";

type Props = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
};

/**
 * 安全的图片组件：加载失败时自动降级为 fallback
 */
export default function SafeImage({ src, alt = "", className = "", fallback }: Props) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
