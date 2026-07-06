"use client";

import { useState } from "react";

interface Props {
  username: string;
  enrollmentNo?: string;
  siteOrigin: string;
}

export default function ProfileActions({ username, enrollmentNo, siteOrigin }: Props) {
  const [copied, setCopied] = useState<"readme" | "link" | null>(null);

  const cardUrl = enrollmentNo ? `${siteOrigin}/card/${enrollmentNo}` : null;

  const readmeMarkdown = cardUrl
    ? `![${username}'s BURank Card](${cardUrl})`
    : null;

  const copy = async (text: string, kind: "readme" | "link") => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="card profile-readme">
      <div className="profile-readme-head">
        <div>
          <h2>GitHub README Card</h2>
          <p className="profile-readme-sub">
            Copy the markdown below and paste it into your GitHub profile README to show your BURank stats.
          </p>
        </div>
      </div>

      {readmeMarkdown ? (
        <>
          <pre className="profile-readme-code">{readmeMarkdown}</pre>
          <div className="profile-readme-actions">
            <button
              className="profile-readme-btn primary"
              onClick={() => copy(readmeMarkdown, "readme")}
            >
              {copied === "readme" ? "Copied!" : "Copy README markdown"}
            </button>
            <button
              className="profile-readme-btn secondary"
              onClick={() => cardUrl && copy(cardUrl, "link")}
            >
              {copied === "link" ? "Copied!" : "Copy card link"}
            </button>
          </div>
        </>
      ) : (
        <p className="profile-readme-unavailable">
          Enrollment number not found — register via the leaderboard to generate your GitHub card.
        </p>
      )}
    </div>
  );
}
