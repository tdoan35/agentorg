"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface PermissionCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function PermissionCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
}: PermissionCheckboxProps) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="border-[var(--border-strong)] data-[state=checked]:bg-[var(--accent-primary)] data-[state=checked]:border-[var(--accent-primary)]"
      />
      <label
        htmlFor={id}
        className={`text-sm cursor-pointer ${
          checked
            ? "text-[var(--text-secondary)]"
            : "text-[var(--text-tertiary)]"
        }`}
      >
        {label}
      </label>
    </div>
  );
}
