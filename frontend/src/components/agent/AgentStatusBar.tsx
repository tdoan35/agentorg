"use client";

import type { AgentEventType } from "@/lib/types";

const STATUS_LABELS: Record<AgentEventType, string> = {
  "agent:thinking": "Agent is thinking...",
  "agent:routing": "Routing to another agent...",
  "agent:permission_check": "Checking permissions...",
  "agent:awaiting_approval": "Awaiting human approval...",
  "agent:approved": "Approved!",
  "agent:denied": "Request denied",
  "agent:fulfilled": "Request fulfilled",
  "agent:responding": "Composing response...",
  "agent:error": "An error occurred",
};

interface AgentStatusBarProps {
  status: AgentEventType | "idle";
  target?: string;
}

export function AgentStatusBar({ status, target }: AgentStatusBarProps) {
  if (status === "idle") return null;

  const label = STATUS_LABELS[status] ?? status;
  const isActive = ["agent:thinking", "agent:routing", "agent:permission_check", "agent:awaiting_approval", "agent:responding"].includes(status);

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] mb-4">
      {isActive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]" />
        </span>
      )}
      <span className="text-xs text-[var(--text-secondary)]">
        {label}
        {target && (
          <span className="text-[var(--text-tertiary)]"> &rarr; {target}</span>
        )}
      </span>
    </div>
  );
}
