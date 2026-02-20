"use client";

import { useState } from "react";
import { AgentHero } from "@/components/agent/AgentHero";
import { AgentSelector } from "@/components/agent/AgentSelector";
import { PermissionsCard } from "@/components/agent/PermissionsCard";
import { PERSONAS, type PersonaSlug } from "@/lib/personas";

export default function AgentsPage() {
  const [selected, setSelected] = useState<PersonaSlug>("finance-manager");
  const persona = PERSONAS[selected];

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 pb-10 h-full">
      <AgentHero persona={persona} />
      <AgentSelector selected={selected} onSelect={setSelected} />
      <PermissionsCard key={selected} persona={persona} />
    </div>
  );
}
