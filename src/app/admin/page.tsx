"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LeetCodeUser } from "@/types";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Dashboard state
  const [users, setUsers] = useState<LeetCodeUser[]>([]);
  const [qotw, setQotw] = useState("");
  const [qotwLoading, setQotwLoading] = useState(false);
  const [qotwSuccess, setQotwSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      
      if (data.success) {
        setIsLoggedIn(true);
        fetchDashboardData();
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [usersRes, qotwRes] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch("/api/qotw")
      ]);
      const usersData = await usersRes.json();
      const qotwData = await qotwRes.json();
      
      setUsers(usersData.users || []);
      setQotw(qotwData.qotw_url || "");
    } catch (err) {
      console.error("Failed to fetch dashboard data");
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete ${username}?`)) return;
    
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", username }),
      });
      const data = await res.json();
      console.log("Delete response:", data);
      if (data.success) {
        setUsers(users.filter(u => u.username !== username));
      } else {
        alert(data.message || "Failed to delete user. Check console for details.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error while deleting user");
    }
  };

  const handleSetQotw = async (e: React.FormEvent) => {
    e.preventDefault();
    setQotwLoading(true);
    setQotwSuccess("");
    
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_qotw", qotw_url: qotw }),
      });
      const data = await res.json();
      if (data.success) {
        setQotwSuccess("Question of the week updated successfully!");
        setTimeout(() => setQotwSuccess(""), 3000);
      } else {
        alert("Failed to set QOTW");
      }
    } catch {
      alert("Network error");
    } finally {
      setQotwLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bu-dark)" }}>
        <div className="w-full max-w-sm rounded-2xl p-8 border animate-slide-up" style={{ background: "var(--bu-card)", borderColor: "var(--bu-border)" }}>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">Admin Login</h1>
            <p className="text-sm" style={{ color: "var(--bu-sub)" }}>Enter password to access dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{ background: "var(--bu-dark)", border: "1px solid var(--bu-border)", color: "var(--bu-text)" }}
              onFocus={e => e.target.style.borderColor = "var(--bu-red)"}
              onBlur={e => e.target.style.borderColor = "var(--bu-border)"}
              autoFocus
            />
            
            {error && <p className="text-sm text-[var(--hard)] font-medium">{error}</p>}
            
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40"
              style={{ background: "var(--bu-red)", color: "#fff" }}
            >
              {loading ? "Verifying..." : "Login"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-xs hover:underline" style={{ color: "var(--bu-sub)" }}>
              ← Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--bu-dark)" }}>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--ink)] mb-2">Admin Dashboard</h1>
            <p className="text-sm" style={{ color: "var(--bu-sub)" }}>Manage users and settings</p>
          </div>
          <Link href="/" className="px-4 py-2 rounded-xl text-sm font-medium border hover:text-[var(--ink)] transition-colors" style={{ borderColor: "var(--bu-border)", color: "var(--bu-sub)" }}>
            View Site ↗
          </Link>
        </div>

        {/* Question of the Week Panel */}
        <div className="rounded-2xl border p-6 mb-8" style={{ background: "var(--bu-card)", borderColor: "var(--bu-border)" }}>
          <h2 className="text-lg font-bold text-[var(--ink)] mb-4">Question of the Week</h2>
          <form onSubmit={handleSetQotw} className="flex gap-3 items-start flex-col sm:flex-row">
            <div className="flex-1 w-full">
              <input
                type="text"
                value={qotw}
                onChange={e => setQotw(e.target.value)}
                placeholder="Paste LeetCode URL (e.g. https://leetcode.com/problems/two-sum)"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{ background: "var(--bu-dark)", border: "1px solid var(--bu-border)", color: "var(--bu-text)" }}
                onFocus={e => e.target.style.borderColor = "var(--bu-red)"}
                onBlur={e => e.target.style.borderColor = "var(--bu-border)"}
              />
              {qotwSuccess && <p className="text-sm text-[#00b8a3] mt-2 font-medium">{qotwSuccess}</p>}
            </div>
            <button
              type="submit"
              disabled={qotwLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 whitespace-nowrap"
              style={{ background: "var(--bu-red)", color: "#fff" }}
            >
              {qotwLoading ? "Saving..." : "Set Question"}
            </button>
          </form>
        </div>

        {/* User Management Panel */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bu-card)", borderColor: "var(--bu-border)" }}>
          <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: "var(--bu-border)", background: "var(--bg-2)" }}>
            <h2 className="text-lg font-bold text-[var(--ink)]">Registered Users ({users.length})</h2>
            <button onClick={fetchDashboardData} className="text-sm hover:text-[var(--ink)]" style={{ color: "var(--bu-sub)" }}>↻ Refresh</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--bu-border)", color: "var(--bu-sub)" }}>
                  <th className="px-6 py-3 font-medium">Username</th>
                  <th className="px-6 py-3 font-medium">Enrollment</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center" style={{ color: "var(--bu-sub)" }}>No users found</td></tr>
                ) : (
                  users.map(user => (
                    <tr key={user.username} className="border-b hover:bg-[var(--bg-2)] transition-colors" style={{ borderColor: "var(--bu-border)" }}>
                      <td className="px-6 py-3">
                        <a href={`https://leetcode.com/${user.username}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[var(--ink)] hover:underline">
                          {user.username}
                        </a>
                      </td>
                      <td className="px-6 py-3 font-mono" style={{ color: "var(--bu-sub)" }}>
                        {/* If we have it in LeetCodeUser type, otherwise it will be undefined here since API doesn't guarantee it, wait I did add it to LeetCodeUser */}
                        {user.enrollmentNo || "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={() => handleDeleteUser(user.username)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500/20 text-[var(--hard)] transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
