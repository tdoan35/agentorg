"use client";

import type { Persona } from "@/lib/personas";

interface PersonaBadgeProps {
  persona: Persona;
}

export function PersonaBadge({ persona }: PersonaBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: persona.dotColor }}
      />
      <span className="text-xs text-[var(--text-secondary)] font-medium">
        {persona.role}
      </span>
    </div>
  );
}
