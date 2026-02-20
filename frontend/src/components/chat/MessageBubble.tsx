"use client";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  content: string;
  role: "user" | "agent";
  agentName?: string;
}

export function MessageBubble({ content, role, agentName }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-w-[80%]",
        role === "user" ? "items-end self-end" : "items-start self-start"
      )}
    >
      {role === "agent" && agentName && (
        <span className="text-xs text-[var(--text-tertiary)] font-medium">
          {agentName}
        </span>
      )}
      <div
        className={cn(
          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
          role === "user"
            ? "bg-[var(--accent-primary)] text-white rounded-br-md"
            : "bg-[var(--bg-input)] text-[var(--text-secondary)] rounded-bl-md"
        )}
      >
        {content}
      </div>
    </div>
  );
}
