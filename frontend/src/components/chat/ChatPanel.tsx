"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import type { Persona } from "@/lib/personas";

interface ChatPanelProps {
  persona: Persona;
}

export function ChatPanel({ persona }: ChatPanelProps) {
  return (
    <div className="w-full max-w-[720px] mt-8">
      <CopilotChat
        labels={{
          title: `${persona.role} Agent`,
          initial: `Hi, I'm ${persona.name}'s agent. How can I help?`,
          placeholder: "Ask your agent anything...",
        }}
        className="h-[400px]"
      />
    </div>
  );
}
