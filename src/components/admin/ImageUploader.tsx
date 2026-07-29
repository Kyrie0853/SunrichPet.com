"use client";

import { useState, useRef } from "react";

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  isVideo: boolean;
}

export default function ImageUploader({
  existingUrls,
  onChange,
}: {
  existingUrls: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploaded, setUploaded] = useState<UploadedFile[]>(() =>
    existingUrls.map((url, i) => ({
      id: `existing-${i}`,
      url,
      name: url.split("/").pop() || `image-${i}`,
      isVideo: url.match(/\.(mp4|mov|webm|avi)(\?|$)/i) !== null,
    }))
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function getUrls(files: UploadedFile[]) {
    return files.map((f) => f.url);
  }

  function handleRemove(id: string) {
    const next = uploaded.filter((f) => f.id !== id);
    setUploaded(next);
    onChange(getUrls(next));
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate sizes
    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`${file.name} 超过大小限制（${isVideo ? "50MB" : "10MB"}）`);
        return;
      }
    }

    setUploading(true);
    setError("");

    const newFiles: UploadedFile[] = [];

    for (const file of files) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "上传失败");
        }

        const data = await res.json();
        newFiles.push({
          id: `upload-${Date.now()}-${Math.random()}`,
          url: data.url,
          name: file.name,
          isVideo: file.type.startsWith("video/"),
        });
      } catch (err: any) {
        setError(`${file.name}: ${err.message}`);
      }
    }

    const next = [...uploaded, ...newFiles];
    setUploaded(next);
    onChange(getUrls(next));
    setUploading(false);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[#1a7f5a]/40 bg-[#e8f5ef] px-5 py-3 text-[14px] font-medium text-[#1a7f5a] hover:bg-[#d4f0e4] transition-colors disabled:opacity-50 min-h-[48px]"
        >
          {uploading ? (
            <>⏳ 上传中...</>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              从相册/相机上传
            </>
          )}
        </button>
        <span className="text-[11px] text-[#9ca3af]">图片≤10MB · 视频≤50MB · 可选择多张</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      {error && <div className="rounded-lg bg-red-50 p-2 text-[12px] text-red-600">{error}</div>}

      {/* Preview grid */}
      {uploaded.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {uploaded.map((f) => (
            <div key={f.id} className="relative group aspect-square rounded-lg bg-gray-100 overflow-hidden border border-[#e5e7eb]">
              {f.isVideo ? (
                <video src={f.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={f.url} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
              )}
              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemove(f.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-[12px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                aria-label={`删除 ${f.name}`}
              >
                ✕
              </button>
              {f.isVideo && (
                <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">🎬</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* URL 手动输入（作为备用方案） */}
      <details className="text-[12px]">
        <summary className="text-[#9ca3af] cursor-pointer hover:text-[#6b7280]">或手动输入图片URL</summary>
        <textarea
          value={uploaded.map((f) => f.url).join("\n")}
          onChange={(e) => {
            const urls = e.target.value.split("\n").map((u) => u.trim()).filter(Boolean);
            setUploaded(urls.map((url, i) => ({
              id: `text-${i}`,
              url,
              name: url.split("/").pop() || `url-${i}`,
              isVideo: /\.(mp4|mov|webm|avi)(\?|$)/i.test(url),
            })));
            onChange(urls);
          }}
          rows={4}
          placeholder="https://example.com/img1.jpg"
          className="mt-2 w-full rounded-lg border px-3 py-2 text-[16px] outline-none focus:border-[#1a7f5a] resize-none"
        />
      </details>
    </div>
  );
}
