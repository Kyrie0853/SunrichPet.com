"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  avatarUrl?: string|null;
  displayName?: string|null;
  size?: number;
  editable?: boolean;
  clickable?: boolean;
  onAvatarChange?: (url: string) => void;
};

const ALLOWED_TYPES = ["image/jpeg","image/png","image/webp","image/gif"];
const MAX_SIZE = 2 * 1024 * 1024;

export default function Avatar({ userId, avatarUrl, displayName, size = 40, editable = false, clickable = false, onAvatarChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(avatarUrl);
  const [imgError, setImgError] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const initial = (displayName || "U").charAt(0).toUpperCase();
  const showImage = url && !imgError;

  const triggerFile = () => { if (editable) inputRef.current?.click(); };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { setError("仅支持 JPG、PNG、GIF、WebP 格式"); return; }
    if (file.size > MAX_SIZE) { setError("图片大小不能超过 2MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = userId + "/avatar-" + Date.now() + "." + ext;
      // 删除旧头像
      if (url) { const oldPath = url.split("/community-images/")[1]; supabase.storage.from("community-images").remove([oldPath]).then(()=>{},()=>{}); }
      const { error: upErr } = await supabase.storage.from("community-images").upload(fileName, file, { contentType: file.type, upsert: false });
      if (upErr) { setError("上传失败: " + upErr.message); console.error("Upload:", upErr); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(fileName);
      const newUrl = urlData.publicUrl;
      // 更新 profiles
      const { error: updateErr } = await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", userId);
      if (updateErr) { setError("保存失败: " + updateErr.message); console.error("Update:", updateErr); supabase.storage.from("community-images").remove([fileName]).then(()=>{},()=>{}); setUploading(false); return; }
      setUrl(newUrl);
      if (onAvatarChange) onAvatarChange(newUrl);
    } catch (err: any) { setError("网络错误，请重试"); console.error("Exception:", err); }
    setUploading(false);
    e.target.value = "";
  };


  const avatarEl = (
    <div onClick={triggerFile} className={"relative h-full w-full rounded-full overflow-hidden flex items-center justify-center text-white font-bold select-none transition-all " + (editable ? "cursor-pointer border-2 border-dashed border-emerald-400 hover:border-emerald-600" : clickable ? "cursor-pointer hover:scale-105 hover:shadow-md" : "") + (showImage ? "" : " bg-emerald-500")} style={{ fontSize: size * 0.4 }}>
      {showImage ? (<img src={url} alt="" className="h-full w-full object-cover" draggable={false} onError={() => setImgError(true)} />) : initial}
      {editable && !uploading && (<div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/30 pointer-events-none">
        <svg className="mb-1 h-4 w-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-[10px] text-white font-medium drop-shadow">更换头像</span>
      </div>)}
      {uploading && (<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
        <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>)}
    </div>
  );

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {clickable ? (
        <Link href={"/community/user/" + userId} className="block h-full w-full">
          {avatarEl}
        </Link>
      ) : (
        avatarEl
      )}
      {error && (<div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-500 px-2 py-1 text-xs text-white shadow">{error}</div>)}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleUpload} className="hidden" />
    </div>
  );
}
