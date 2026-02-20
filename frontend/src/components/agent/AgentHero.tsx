"use client";

import type { Persona } from "@/lib/personas";
import { TrendingUp, Calculator, Crown } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  TrendingUp,
  Calculator,
  Crown,
};

interface AgentHeroProps {
  persona: Persona;
}

export function AgentHero({ persona }: AgentHeroProps) {
  const Icon = ICON_MAP[persona.icon];

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${persona.gradientFrom}, ${persona.gradientTo})`,
        }}
      >
        {Icon && (
          <Icon
            className="w-10 h-10"
            style={{ color: persona.iconColor }}
          />
        )}
      </div>
      <div className="text-center">
        <h1
          className="text-4xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {persona.name}
        </h1>
        <p className="text-[var(--text-tertiary)] text-sm mt-1">
          {persona.role} &middot; {persona.description}
        </p>
      </div>
    </div>
  );
}
