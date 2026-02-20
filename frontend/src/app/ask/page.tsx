"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { AgentChatPanel } from "@/components/chat/AgentChatPanel";
import { AgentStatusBar } from "@/components/agent/AgentStatusBar";
import { PersonaBadge } from "@/components/persona/PersonaBadge";
import { usePersonaStore, useChatStore } from "@/lib/store";
import { useAgentSSE } from "@/hooks/useAgentSSE";
import { api } from "@/lib/api";
import { Bot } from "lucide-react";

export default function AskPage() {
  const { activePersona } = usePersonaStore();
  const { conversationId, setConversationId } = useChatStore();
  const { events, status } = useAgentSSE(conversationId);

  // Make the active persona and conversation context available to CopilotKit
  useCopilotReadable({
    description: "The current user persona and agent context",
    value: {
      persona: activePersona.slug,
      role: activePersona.role,
      name: activePersona.name,
      conversationId,
    },
  });

  // Register a CopilotKit action so its model can query our agent network
  useCopilotAction({
    name: "queryAgentNetwork",
    description:
      "Send a question to the AgentOrg multi-agent network. Use this when the user asks about financial data, P&L statements, invoices, budgets, or needs to coordinate between agents.",
    parameters: [
      {
        name: "message",
        type: "string",
        description: "The question or request to send to the agent network",
        required: true,
      },
    ],
    handler: async ({ message }: { message: string }) => {
      const res = await api.chat({
        message,
        persona: activePersona.slug,
        conversation_id: conversationId ?? undefined,
      });
      if (!conversationId && res.conversation_id) {
        setConversationId(res.conversation_id);
      }
      return `[${res.agent}]: ${res.response}`;
    },
  });

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
      <AgentChatPanel persona={activePersona} events={events} />
    </div>
  );
}
