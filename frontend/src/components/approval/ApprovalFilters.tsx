"use client";

import { cn } from "@/lib/utils";

type FilterValue = "all" | "pending" | "approved";

interface ApprovalFiltersProps {
  active: FilterValue;
  onChange: (filter: FilterValue) => void;
}

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
];

export function ApprovalFilters({ active, onChange }: ApprovalFiltersProps) {
  return (
    <div className="flex items-center gap-1">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            active === f.value
              ? "bg-[var(--bg-hover)] text-white font-semibold"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
