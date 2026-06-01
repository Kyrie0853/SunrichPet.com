"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ---- 角色标签 ----
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    super_admin: { label: "超管", cls: "bg-purple-50 text-purple-700" },
    admin: { label: "管理员", cls: "bg-blue-50 text-blue-700" },
    seller: { label: "商家", cls: "bg-amber-50 text-amber-700" },
  };
  const m = map[role] || { label: "用户", cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={"inline-block rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-medium " + m.cls}>
      {m.label}
    </span>
  );
}

// ---- 操作确认弹窗 ----
function ConfirmModal({ message, confirmLabel, confirmClass, onConfirm, onCancel }: {
  message: string; confirmLabel: string; confirmClass: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[90%] sm:max-w-sm p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <p className="text-[14px] text-[#1f2937] mb-5 text-center">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button onClick={onCancel} className="flex-1 rounded-full border border-[#e5e7eb] py-2.5 text-[13px] text-[#6b7280] hover:bg-[#f9fafb] min-h-[44px]">
            取消
          </button>
          <button onClick={onConfirm} className={"flex-1 rounded-full py-2.5 text-[13px] font-medium text-white min-h-[44px] " + confirmClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const supabase = createClient();

  // 自定义确认弹窗
  const [confirm, setConfirm] = useState<{ message: string; label: string; cls: string; action: () => void } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (roleFilter) params.set("role", roleFilter);
    const res = await fetch("/api/admin/users?" + params.toString());
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [search, roleFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || "")); }, []);

  async function changeRole(userId: string, newRole: string) {
    await fetch(`/api/admin/users/${userId}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
    loadUsers();
  }

  async function toggleBan(userId: string, banned: boolean) {
    await fetch(`/api/admin/users/${userId}/ban`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ banned }) });
    loadUsers();
  }

  // ---- 渲染函数 ----
  const renderUserAvatar = (u: any) => (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[12px] font-bold text-white shrink-0">
      {(u.display_name || "U")[0]}
    </div>
  );

  const roleBtnClass = (u: any, role: string) =>
    "rounded-full px-2.5 py-1.5 text-[11px] transition-colors font-medium min-w-[44px] min-h-[44px] flex items-center justify-center " +
    (u.role === role ? "bg-[#e8f5ef] text-[#1a7f5a]" : "text-[#6b7280] hover:bg-[#f3f4f6]");

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-4 md:mb-6">用户管理</h1>

      {/* ---- 搜索与筛选 ---- */}
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索用户..."
          className="w-full h-11 rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-5 text-[16px] md:text-[13px] outline-none focus:border-[#1a7f5a] focus:ring-2 focus:ring-[#1a7f5a]/10"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="w-full h-11 rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-5 text-[16px] md:text-[13px] outline-none focus:border-[#1a7f5a]">
          <option value="">全部角色</option>
          <option value="customer">普通用户</option>
          <option value="seller">商家</option>
          <option value="admin">管理员</option>
          <option value="super_admin">超级管理员</option>
        </select>
      </div>

      {/* ---- 加载状态 ---- */}
      {loading && (
        <div className="text-center py-12 text-[#9ca3af] text-[14px]">加载中...</div>
      )}

      {/* ---- 空状态 ---- */}
      {!loading && users.length === 0 && (
        <div className="text-center py-16 text-[#9ca3af]">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-[14px]">无匹配用户</p>
        </div>
      )}

      {/* ========== 移动端卡片布局 (< 768px) ========== */}
      {!loading && users.length > 0 && (
        <div className="md:hidden space-y-2.5">
          {users.map((u: any) => (
            <div key={u.id} className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-4">
              {/* 第一行：头像 + 昵称 + 角色 */}
              <div className="flex items-center gap-3">
                {renderUserAvatar(u)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1f2937] text-[15px] truncate">{u.display_name || "未知"}</span>
                    <RoleBadge role={u.role} />
                    {u.is_banned && <span className="text-[10px] bg-red-50 text-red-600 rounded-full px-1.5 py-0.5 font-medium">已封禁</span>}
                  </div>
                  {/* 第二行：邮箱 */}
                  <p className="text-[12px] text-[#9ca3af] truncate mt-0.5">{u.email || "无邮箱"}</p>
                </div>
              </div>

              {/* 第三行：积分 + 注册时间 */}
              <div className="flex items-center gap-4 mt-3 text-[12px] text-[#9ca3af]">
                <span>⭐ {u.points || 0} 积分</span>
                <span>📅 {u.created_at ? new Date(u.created_at).toLocaleDateString("zh-CN") : "-"}</span>
              </div>

              {/* 第四行：操作按钮 */}
              {u.id !== currentUserId && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#f3f4f6]">
                  {/* 角色切换 */}
                  <div className="flex gap-1 flex-1">
                    {["customer", "seller", "admin"].map(role => (
                      <button key={role} onClick={() =>
                        setConfirm({ message: `确定将用户角色改为「${role === "customer" ? "普通用户" : role === "seller" ? "商家" : "管理员"}」?`, label: "确认修改", cls: "bg-[#1a7f5a] hover:bg-[#166b4b]", action: () => { changeRole(u.id, role); setConfirm(null); } })
                      } className={roleBtnClass(u, role)}>
                        {role === "customer" ? "用户" : role === "seller" ? "商家" : "管理"}
                      </button>
                    ))}
                  </div>
                  {/* 封禁按钮 */}
                  <button onClick={() =>
                    setConfirm({
                      message: u.is_banned ? "确定解封该用户？" : "确定封禁该用户？封禁后该用户无法登录。",
                      label: u.is_banned ? "确认解封" : "确认封禁",
                      cls: u.is_banned ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600",
                      action: () => { toggleBan(u.id, !u.is_banned); setConfirm(null); }
                    })
                  } className={"rounded-full px-4 py-2 text-[12px] font-medium min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 " +
                    (u.is_banned ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                    {u.is_banned ? "解封" : "封禁"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========== 桌面端表格布局 (≥768px) ========== */}
      {!loading && users.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                  <th className="text-left px-4 py-3 font-medium text-[#6b7280]">用户</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6b7280]">角色</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6b7280]">积分</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6b7280]">注册时间</th>
                  <th className="text-right px-4 py-3 font-medium text-[#6b7280]">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {renderUserAvatar(u)}
                        <div className="min-w-0">
                          <p className="font-medium text-[#1f2937] truncate">{u.display_name || "未知"}</p>
                          <p className="text-[11px] text-[#9ca3af] truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 text-[#6b7280]">⭐ {u.points || 0}</td>
                    <td className="px-4 py-3 text-[#6b7280]">{u.created_at ? new Date(u.created_at).toLocaleDateString("zh-CN") : "-"}</td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== currentUserId && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setConfirm({ message: `确定将用户角色改为「管理员」?`, label: "确认", cls: "bg-[#1a7f5a] hover:bg-[#166b4b]", action: () => { changeRole(u.id, "admin"); setConfirm(null); } })}
                            className="rounded-full px-2.5 py-1 text-[11px] text-[#6b7280] hover:bg-[#f3f4f6]">改角色</button>
                          <button onClick={() => setConfirm({ message: u.is_banned ? "确定解封？" : "确定封禁？", label: u.is_banned ? "解封" : "封禁", cls: u.is_banned ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600", action: () => { toggleBan(u.id, !u.is_banned); setConfirm(null); } })}
                            className={"rounded-full px-2.5 py-1 text-[11px] " + (u.is_banned ? "text-emerald-600 hover:bg-emerald-50" : "text-red-500 hover:bg-red-50")}>
                            {u.is_banned ? "解封" : "封禁"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- 确认弹窗 ---- */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          confirmLabel={confirm.label}
          confirmClass={confirm.cls}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
