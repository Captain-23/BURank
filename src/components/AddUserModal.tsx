"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({ onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [yearStudying, setYearStudying] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setStatus("error");
      setMessage("Username and password are required.");
      return;
    }

    if (mode === "register") {
      const trimmedEnrollment = enrollmentNo.trim().toUpperCase();
      if (!trimmedEnrollment) {
        setStatus("error");
        setMessage("Please enter your enrollment number.");
        return;
      }
      if (!yearStudying) {
        setStatus("error");
        setMessage("Please select your year of study.");
        return;
      }

      setStatus("loading");
      setMessage("");

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: trimmedUser,
            password: trimmedPass,
            yearStudying,
            enrollmentNo: trimmedEnrollment,
          }),
        });
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message ?? "Registered & Logged in!");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          setStatus("error");
          setMessage(data.message ?? "Registration failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    } else {
      // Login mode
      setStatus("loading");
      setMessage("");

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: trimmedUser, password: trimmedPass }),
        });
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage("Logged in successfully!");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1000);
        } else {
          setStatus("error");
          setMessage(data.message ?? "Login failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 animate-slide-up"
        style={{
          background: "var(--bu-card)",
          borderColor: "var(--bu-border)",
        }}
      >
        {/* Header & Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4">
            <button
              className={`text-xl font-bold transition-colors ${mode === "login" ? "text-white" : "opacity-50"}`}
              onClick={() => { setMode("login"); setStatus("idle"); setMessage(""); }}
              type="button"
            >
              Login
            </button>
            <button
              className={`text-xl font-bold transition-colors ${mode === "register" ? "text-white" : "opacity-50"}`}
              onClick={() => { setMode("register"); setStatus("idle"); setMessage(""); }}
              type="button"
            >
              Register
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-colors hover:text-white"
            style={{ color: "var(--bu-sub)" }}
            type="button"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--bu-sub)" }}>
              LeetCode Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setStatus("idle"); setMessage(""); }}
              placeholder="e.g. your_leetcode_handle"
              disabled={status === "loading" || status === "success"}
              className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all"
              style={{ background: "var(--bu-dark)", border: "1px solid var(--bu-border)", color: "var(--bu-text)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--bu-red)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--bu-border)")}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--bu-sub)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setStatus("idle"); setMessage(""); }}
              placeholder="••••••••"
              disabled={status === "loading" || status === "success"}
              className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all"
              style={{ background: "var(--bu-dark)", border: "1px solid var(--bu-border)", color: "var(--bu-text)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--bu-red)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--bu-border)")}
            />
          </div>

          {mode === "register" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--bu-sub)" }}>
                  Enrollment No.
                </label>
                <input
                  type="text"
                  value={enrollmentNo}
                  onChange={(e) => { setEnrollmentNo(e.target.value.toUpperCase()); setStatus("idle"); setMessage(""); }}
                  placeholder="e.g. E24CSEU0000"
                  disabled={status === "loading" || status === "success"}
                  className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all uppercase"
                  style={{ background: "var(--bu-dark)", border: "1px solid var(--bu-border)", color: "var(--bu-text)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--bu-red)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--bu-border)")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--bu-sub)" }}>
                  Year Studying
                </label>
                <select
                  value={yearStudying}
                  onChange={(e) => { setYearStudying(e.target.value); setStatus("idle"); setMessage(""); }}
                  disabled={status === "loading" || status === "success"}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ background: "var(--bu-dark)", border: "1px solid var(--bu-border)", color: "var(--bu-text)", appearance: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--bu-red)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--bu-border)")}
                >
                  <option value="" disabled>Select your year</option>
                  <option value="26-30">First Year (26-30)</option>
                  <option value="25-29">Second Year (25-29)</option>
                  <option value="24-28">Third Year (24-28)</option>
                  <option value="23-27">Fourth Year (23-27)</option>
                </select>
              </div>
            </>
          )}

          {/* Status message */}
          {message && (
            <p className="text-sm font-medium" style={{ color: status === "success" ? "#00b8a3" : status === "error" ? "#ff375f" : "var(--bu-sub)" }}>
              {status === "success" && "✓ "}
              {status === "error" && "✗ "}
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !password.trim() || status === "loading" || status === "success"}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: status === "success" ? "#00b8a3" : "var(--bu-red)", color: "#fff" }}
          >
            {status === "loading"
              ? "Loading..."
              : status === "success"
              ? mode === "login" ? "Logged In! ✓" : "Registered! ✓"
              : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        {/* Hint */}
        {mode === "register" && (
          <p className="mt-4 text-xs text-center" style={{ color: "var(--bu-sub)" }}>
            Your username is verified against LeetCode before being added.
          </p>
        )}
      </div>
    </div>
  );
}
