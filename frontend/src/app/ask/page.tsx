"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { AgentStatusBar } from "@/components/agent/AgentStatusBar";
import { PersonaBadge } from "@/components/persona/PersonaBadge";
import { usePersonaStore } from "@/lib/store";
import { useAgentSSE } from "@/hooks/useAgentSSE";
import { Bot } from "lucide-react";

export default function AskPage() {
  const { activePersona } = usePersonaStore();
  const { status } = useAgentSSE(null);

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full">
      <AgentStatusBar status={status} />
      <div className="flex flex-col items-center gap-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${activePersona.gradientFrom}, ${activePersona.gradientTo})`,
          }}
        >
          <Bot className="w-7 h-7 text-white" />
        </div>
        <h1
          className="text-[28px] font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          How can I help you today?
        </h1>
        <p className="text-[var(--text-tertiary)] text-sm text-center max-w-[420px]">
          Ask your agent anything. It will coordinate with other agents on your
          behalf.
        </p>
        <PersonaBadge persona={activePersona} />
      </div>
      <ChatPanel persona={activePersona} />
    </div>
  );
}
