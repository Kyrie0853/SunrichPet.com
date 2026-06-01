"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const supabase = createClient();

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
    if (!confirm(`确定将用户角色改为 ${newRole}?`)) return;
    await fetch(`/api/admin/users/${userId}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
    loadUsers();
  }

  async function toggleBan(userId: string, banned: boolean) {
    if (!confirm(banned ? "确定封禁该用户?" : "确定解封该用户?")) return;
    await fetch(`/api/admin/users/${userId}/ban`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ banned }) });
    loadUsers();
  }

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-4 md:mb-6">用户管理</h1>
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户..." className="w-full sm:w-64 h-10 md:h-9 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[16px] md:text-[13px] outline-none focus:border-[#1a7f5a] focus:ring-1 focus:ring-[#1a7f5a]/15" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-10 md:h-9 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[16px] md:text-[13px] outline-none">
          <option value="">全部角色</option>
          <option value="customer">普通用户</option>
          <option value="admin">管理员</option>
          <option value="super_admin">超级管理员</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-[#f3f4f6] bg-[#f9fafb]"><th className="text-left px-3 md:px-4 py-3 font-medium text-[#6b7280]">用户</th><th className="text-left px-3 md:px-4 py-3 font-medium text-[#6b7280] hidden sm:table-cell">角色</th><th className="text-left px-3 md:px-4 py-3 font-medium text-[#6b7280] hidden md:table-cell">积分</th><th className="text-left px-3 md:px-4 py-3 font-medium text-[#6b7280] hidden lg:table-cell">注册时间</th><th className="text-right px-3 md:px-4 py-3 font-medium text-[#6b7280]">操作</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="text-center py-8 text-[#9ca3af]">加载中...</td></tr>
              : users.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-[#9ca3af]">无匹配用户</td></tr>
              : users.map((u: any) => (
                <tr key={u.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors">
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">{(u.display_name||"U")[0]}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#1f2937] truncate text-[13px]">{u.display_name||"未知"}</p>
                        <p className="text-[11px] text-[#9ca3af] truncate">{u.email}</p>
                        {/* 移动端显示角色标签 */}
                        <span className={'sm:hidden inline-block mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ' + (u.role==="super_admin"?"bg-purple-50 text-purple-700":u.role==="admin"?"bg-blue-50 text-blue-700":"bg-gray-100 text-gray-600")}>
                          {u.role==="super_admin"?"超管":u.role==="admin"?"管理员":"用户"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-4 py-3 hidden sm:table-cell">
                    <span className={'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ' + (u.role==="super_admin"?"bg-purple-50 text-purple-700":u.role==="admin"?"bg-blue-50 text-blue-700":"bg-gray-100 text-gray-600")}>
                      {u.role==="super_admin"?"超管":u.role==="admin"?"管理员":"用户"}
                    </span>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-[#6b7280] hidden md:table-cell">⭐ {u.points||0}</td>
                  <td className="px-3 md:px-4 py-3 text-[#6b7280] hidden lg:table-cell">{u.created_at?new Date(u.created_at).toLocaleDateString("zh-CN"):"-"}</td>
                  <td className="px-3 md:px-4 py-3 text-right">
                    {u.id!==currentUserId && (
                      <div className="flex items-center justify-end gap-1 md:gap-1.5">
                        <button onClick={()=>changeRole(u.id,"customer")} className="rounded-full px-2 md:px-2.5 py-1.5 md:py-1 text-[11px] text-[#6b7280] hover:bg-[#f3f4f6] min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center">改角色</button>
                        <button onClick={()=>toggleBan(u.id,!u.banned)} className={'rounded-full px-2 md:px-2.5 py-1.5 md:py-1 text-[11px] min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center ' + (u.banned?"text-emerald-600 hover:bg-emerald-50":"text-red-500 hover:bg-red-50")}>{u.banned?"解封":"封禁"}</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
