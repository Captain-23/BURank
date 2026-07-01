"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type Status = "idle" | "loading" | "success" | "error";

export default function AddUserModal({ onClose, onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [yearStudying, setYearStudying] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUser = username.trim();
    const trimmedEnrollment = enrollmentNo.trim().toUpperCase();

    if (!trimmedUser) {
      setStatus("error");
      setMessage("Please enter your LeetCode username.");
      return;
    }

    if (!trimmedEnrollment) {
      setStatus("error");
      setMessage("Please enter your Enrollment Number.");
      return;
    }

    if (!yearStudying) {
      setStatus("error");
      setMessage("Please select your year of study.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUser,
          enrollmentNo: trimmedEnrollment,
          yearStudying,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus("error");
        setMessage(data.message || "Registration failed.");
        return;
      }

      setStatus("success");
      setMessage("Successfully joined the leaderboard!");

      onSuccess();

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);

      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 animate-slide-up"
        style={{
          background: "var(--bu-card)",
          borderColor: "var(--bu-border)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Join Leaderboard
          </h2>

          <button
            onClick={onClose}
            type="button"
            className="text-2xl hover:text-white transition-colors"
            style={{ color: "var(--bu-sub)" }}
          >
            ×
          </button>
        </div>

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
              placeholder="your_leetcode_username"
              disabled={status === "loading" || status === "success"}
              className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none"
              style={{
                background: "var(--bu-dark)",
                border: "1px solid var(--bu-border)",
                color: "var(--bu-text)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--bu-sub)" }}
            >
              Enrollment Number
            </label>

            <input
              type="text"
              value={enrollmentNo}
              onChange={(e) => {
                setEnrollmentNo(e.target.value.toUpperCase());
                setStatus("idle");
                setMessage("");
              }}
              placeholder="E24CSEU0000"
              disabled={status === "loading" || status === "success"}
              className="w-full rounded-xl px-4 py-3 text-sm font-mono uppercase outline-none"
              style={{
                background: "var(--bu-dark)",
                border: "1px solid var(--bu-border)",
                color: "var(--bu-text)",
              }}
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
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                background: "var(--bu-dark)",
                border: "1px solid var(--bu-border)",
                color: "var(--bu-text)",
              }}
            >
              <option value="">Select your year</option>
              <option value="26-30">First Year (26-30)</option>
              <option value="25-29">Second Year (25-29)</option>
              <option value="24-28">Third Year (24-28)</option>
              <option value="23-27">Fourth Year (23-27)</option>
            </select>
          </div>

          {message && (
            <p
              className="text-sm"
              style={{
                color:
                  status === "success"
                    ? "#00b8a3"
                    : status === "error"
                    ? "#ff375f"
                    : "var(--bu-sub)",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={
              !username.trim() ||
              !enrollmentNo.trim() ||
              !yearStudying ||
              status === "loading" ||
              status === "success"
            }
            className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-40"
            style={{
              background:
                status === "success"
                  ? "#00b8a3"
                  : "var(--bu-red)",
              color: "#fff",
            }}
          >
            {status === "loading"
              ? "Joining..."
              : status === "success"
              ? "Joined! ✓"
              : "Join Leaderboard"}
          </button>
        </form>

        <p
          className="mt-4 text-xs text-center"
          style={{ color: "var(--bu-sub)" }}
        >
          Your LeetCode username will be verified before being added to the
          leaderboard.
        </p>
      </div>
    </div>
  );
}