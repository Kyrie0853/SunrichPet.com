"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createClient();

    if (mode === "register") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      setMessage("注册成功！请检查邮箱并点击确认链接。");
      setLoading(false);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Sunrich Pet
        </h1>

        {/* Tab 切换 */}
        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
          >
            登录
          </button>
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "register"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setMode("register");
              setError("");
              setMessage("");
            }}
          >
            注册
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="请输入用户名"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="至少 6 位密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "处理中..."
              : mode === "login"
                ? "登录"
                : "注册"}
          </button>
        </form>
      </div>
    </div>
  );
}
