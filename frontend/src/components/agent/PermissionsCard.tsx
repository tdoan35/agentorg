"use client";

import { useState } from "react";
import type { Persona } from "@/lib/personas";
import {
  ALL_DATA_RESOURCES,
  ALL_TOOLS,
  ALL_AGENTS,
  PERSONAS,
} from "@/lib/personas";
import { PermissionCheckbox } from "./PermissionCheckbox";
import { Database, Wrench, GitBranch } from "lucide-react";

interface PermissionsCardProps {
  persona: Persona;
}

export function PermissionsCard({ persona }: PermissionsCardProps) {
  const [permissions, setPermissions] = useState(persona.defaultPermissions);

  const toggle = (
    category: "dataAccess" | "tools" | "routing",
    value: string
  ) => {
    setPermissions((prev) => {
      const arr = prev[category];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [category]: next };
    });
  };

  return (
    <div className="w-[720px] bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)] p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Data Access */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-[var(--text-tertiary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Data Access
            </h3>
          </div>
          <div className="flex flex-col gap-0.5">
            {ALL_DATA_RESOURCES.map((res) => (
              <PermissionCheckbox
                key={res}
                id={`${persona.slug}-data-${res}`}
                label={res}
                checked={permissions.dataAccess.includes(res)}
                onCheckedChange={() => toggle("dataAccess", res)}
              />
            ))}
          </div>
        </div>

        {/* Tools */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-[var(--text-tertiary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Tools
            </h3>
          </div>
          <div className="flex flex-col gap-0.5">
            {ALL_TOOLS.map((tool) => (
              <PermissionCheckbox
                key={tool}
                id={`${persona.slug}-tool-${tool}`}
                label={tool}
                checked={permissions.tools.includes(tool)}
                onCheckedChange={() => toggle("tools", tool)}
              />
            ))}
          </div>
        </div>

        {/* Routing */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-[var(--text-tertiary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Routing
            </h3>
          </div>
          <div className="flex flex-col gap-0.5">
            {ALL_AGENTS.filter((s) => s !== persona.slug).map((slug) => (
              <PermissionCheckbox
                key={slug}
                id={`${persona.slug}-route-${slug}`}
                label={PERSONAS[slug].role}
                checked={permissions.routing.includes(slug)}
                onCheckedChange={() => toggle("routing", slug)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
