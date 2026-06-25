"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({ onClose, onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [yearStudying, setYearStudying] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    const trimmedEnrollment = enrollmentNo.trim().toUpperCase();

    if (!trimmed) return;
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
      const res = await fetch("/api/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed, yearStudying, enrollmentNo: trimmedEnrollment }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message ?? "Added!");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setStatus("error");
        setMessage(data.message ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Join the Board</h2>
            <p className="text-sm mt-1" style={{ color: "var(--bu-sub)" }}>
              Enter your LeetCode username to add yourself
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-colors hover:text-white"
            style={{ color: "var(--bu-sub)" }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--bu-sub)" }}
            >
              LeetCode Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setStatus("idle");
                setMessage("");
              }}
              placeholder="e.g. your_leetcode_handle"
              disabled={status === "loading" || status === "success"}
              className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all"
              style={{
                background: "var(--bu-dark)",
                border: "1px solid var(--bu-border)",
                color: "var(--bu-text)",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--bu-red)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--bu-border)")
              }
              autoFocus
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--bu-sub)" }}
            >
              Enrollment No.
            </label>
            <p className="text-[11px] mb-2" style={{ color: "var(--bu-muted)", opacity: 0.7 }}>
              This is only stored so that no one else can create a fake account or a duplicate one.
            </p>
            <input
              type="text"
              value={enrollmentNo}
              onChange={(e) => {
                setEnrollmentNo(e.target.value.toUpperCase());
                setStatus("idle");
                setMessage("");
              }}
              placeholder="e.g. E24CSEU0000"
              disabled={status === "loading" || status === "success"}
              className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all uppercase"
              style={{
                background: "var(--bu-dark)",
                border: "1px solid var(--bu-border)",
                color: "var(--bu-text)",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--bu-red)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--bu-border)")
              }
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--bu-sub)" }}
            >
              Year Studying
            </label>
            <select
              value={yearStudying}
              onChange={(e) => {
                setYearStudying(e.target.value);
                setStatus("idle");
                setMessage("");
              }}
              disabled={status === "loading" || status === "success"}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "var(--bu-dark)",
                border: "1px solid var(--bu-border)",
                color: "var(--bu-text)",
                appearance: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--bu-red)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--bu-border)")
              }
            >
              <option value="" disabled>Select your year</option>
              <option value="26-30">First Year (26-30)</option>
              <option value="25-29">Second Year (25-29)</option>
              <option value="24-28">Third Year (24-28)</option>
              <option value="23-27">Fourth Year (23-27)</option>
            </select>
          </div>

          {/* Status message */}
          {message && (
            <p
              className="text-sm font-medium"
              style={{
                color:
                  status === "success"
                    ? "#00b8a3"
                    : status === "error"
                    ? "#ff375f"
                    : "var(--bu-sub)",
              }}
            >
              {status === "success" && "✓ "}
              {status === "error" && "✗ "}
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={
              !username.trim() ||
              status === "loading" ||
              status === "success"
            }
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:
                status === "success"
                  ? "#00b8a3"
                  : "var(--bu-red)",
              color: "#fff",
            }}
          >
            {status === "loading"
              ? "Validating..."
              : status === "success"
              ? "Added! ✓"
              : "Add to Leaderboard"}
          </button>
        </form>

        {/* Hint */}
        <p className="mt-4 text-xs text-center" style={{ color: "var(--bu-sub)" }}>
          Your username is verified against LeetCode before being added.
        </p>
      </div>
    </div>
  );
}
