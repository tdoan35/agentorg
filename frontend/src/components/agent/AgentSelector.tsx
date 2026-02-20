"use client";

import { cn } from "@/lib/utils";
import { PERSONAS, PERSONA_SLUGS, type PersonaSlug } from "@/lib/personas";

interface AgentSelectorProps {
  selected: PersonaSlug;
  onSelect: (slug: PersonaSlug) => void;
}

export function AgentSelector({ selected, onSelect }: AgentSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {PERSONA_SLUGS.map((slug) => {
        const persona = PERSONAS[slug];
        const isActive = slug === selected;

        return (
          <button
            key={slug}
            onClick={() => onSelect(slug)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
              isActive
                ? "bg-[var(--bg-hover)] border-[var(--accent-primary)] text-white"
                : "bg-transparent border-[var(--border-strong)] text-[var(--text-tertiary)] hover:border-[var(--text-secondary)]"
            )}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: persona.dotColor }}
            />
            {persona.role}
          </button>
        );
      })}
    </div>
  );
}
