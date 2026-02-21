"use client";

import { useState } from "react";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { PersonaBadge } from "@/components/persona/PersonaBadge";
import { InlineApprovalCard } from "@/components/chat/InlineApprovalCard";
import { usePersonaStore, useChatStore } from "@/lib/store";
import { useAgentSSE } from "@/hooks/useAgentSSE";
import { api } from "@/lib/api";
import type { AgentEvent } from "@/lib/types";
import { Bot, Loader2, Wrench, CheckCircle2 } from "lucide-react";
import "./copilot-chat.css";

function SSEEventStream({ events }: { events: AgentEvent[] }) {
  const activeEvents = events.filter(
    (e) => e.type !== ("keepalive" as string) && e.type !== ("idle" as string),
  );
  if (activeEvents.length === 0) return null;

  return (
    <div className="space-y-1 my-2">
      {activeEvents.slice(-3).map((event, i) => (
        <div
          key={`${event.timestamp}-${i}`}
          className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent-primary)]" />
          </span>
          {event.message || event.type}
          {event.target && (
            <span className="text-[var(--text-muted)]">
              &rarr; {event.target}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ToolCallIndicator({
  label,
  status,
}: {
  label: string;
  status: "inProgress" | "executing" | "complete";
}) {
  return (
    <div className="flex items-center gap-2 my-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
      {status === "complete" ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-approved)] shrink-0" />
      ) : (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)] shrink-0" />
      )}
      <Wrench className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
      <span>{label}</span>
    </div>
  );
}

export default function AskPage() {
  const { activePersona } = usePersonaStore();
  const { conversationId, setConversationId } = useChatStore();
  const { events } = useAgentSSE(conversationId);
  const [chatStarted, setChatStarted] = useState(!!conversationId);

  useCopilotReadable({
    description: "The current user persona and agent context",
    value: {
      persona: activePersona.slug,
      role: activePersona.role,
      name: activePersona.name,
      conversationId,
    },
  });

  // Action 1: Query the agent network
  useCopilotAction({
    name: "queryAgentNetwork",
    description:
      "Send a question to the AgentOrg multi-agent network. Use this for ANY user question about financial data, P&L statements, invoices, budgets, or agent coordination. Always use this action to answer user questions.",
    parameters: [
      {
        name: "message",
        type: "string",
        description: "The question or request to send to the agent network",
        required: true,
      },
    ],
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <>
            <ToolCallIndicator label="Querying agent network..." status={status} />
            <SSEEventStream events={events} />
          </>
        );
      }
      if (status === "complete") {
        return <ToolCallIndicator label="Agent network responded" status={status} />;
      }
      return <></>;
    },
    handler: async ({ message }: { message: string }) => {
      const res = await api.chat({
        message,
        persona: activePersona.slug,
        conversation_id: conversationId ?? undefined,
      });
      if (!conversationId && res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      // Check for pending approvals after chat
      const pendingApprovals = await api.getApprovals("pending");
      if (pendingApprovals.length > 0) {
        const latest = pendingApprovals[pendingApprovals.length - 1];
        return JSON.stringify({
          agent: res.agent,
          response: res.response,
          pending_approval: {
            id: latest.id,
            source_agent: latest.source_agent,
            target_agent: latest.target_agent,
            data_type: latest.data_type,
            sensitivity_reason: latest.sensitivity_reason,
          },
        });
      }

      return `[${res.agent}]: ${res.response}`;
    },
  });

  // Action 2: Review an approval (renders inline card, waits for user response)
  useCopilotAction({
    name: "reviewApproval",
    description:
      "Show an inline approval card for the user to approve or deny a pending data request. Call this when queryAgentNetwork returns a pending_approval in its response.",
    parameters: [
      { name: "approval_id", type: "string", description: "The approval request ID", required: true },
      { name: "source_agent", type: "string", description: "The agent that requested the data", required: true },
      { name: "target_agent", type: "string", description: "The agent that owns the data", required: true },
      { name: "data_type", type: "string", description: "Type of data being requested", required: true },
      { name: "sensitivity_reason", type: "string", description: "Why this data requires approval", required: true },
    ],
    renderAndWaitForResponse: ({ args, status, respond }) => {
      const approvalId = args.approval_id ?? "";
      const sourceAgent = args.source_agent ?? "";
      const targetAgent = args.target_agent ?? "";
      const dataType = args.data_type ?? "";
      const sensitivityReason = args.sensitivity_reason ?? "";

      const handleApprove = async () => {
        await api.approveRequest(approvalId);
        respond?.({ approved: true, approval_id: approvalId });
      };

      const handleDeny = async () => {
        await api.denyRequest(approvalId);
        respond?.({ approved: false, approval_id: approvalId });
      };

      return (
        <InlineApprovalCard
          approvalId={approvalId}
          sourceAgent={sourceAgent}
          targetAgent={targetAgent}
          dataType={dataType}
          sensitivityReason={sensitivityReason}
          status={status}
          onApprove={status === "executing" ? handleApprove : undefined}
          onDeny={status === "executing" ? handleDeny : undefined}
        />
      );
    },
  });

  // Action 3: Fulfill an approved request (releases cached data)
  useCopilotAction({
    name: "fulfillApproval",
    description:
      "Release the cached data for an approved request. Call this after the user approves a reviewApproval action. Returns the actual data that was held pending approval.",
    parameters: [
      { name: "approval_id", type: "string", description: "The approval request ID to fulfill", required: true },
    ],
    render: ({ status }) => {
      return (
        <ToolCallIndicator
          label={status === "complete" ? "Data released" : "Fetching approved data..."}
          status={status}
        />
      );
    },
    handler: async ({ approval_id }: { approval_id: string }) => {
      const result = await api.fulfillApproval(approval_id);
      return JSON.stringify(result);
    },
  });

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Hero header — visible before chat starts */}
      {!chatStarted && (
        <div className="flex flex-col items-center gap-6 pt-16 pb-6">
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
      )}

      {/* CopilotChat fills remaining space */}
      <div className="flex-1 mx-auto w-full max-w-[760px] px-4 pt-6 pb-4 min-h-0">
        <CopilotChat
          className="h-full"
          onSubmitMessage={() => setChatStarted(true)}
          instructions={`You are an AI assistant for the AgentOrg multi-agent network. The user is acting as "${activePersona.role}" (persona: ${activePersona.slug}).

When the user asks a question, call the queryAgentNetwork action with their message.

IMPORTANT: When queryAgentNetwork returns a JSON response containing "pending_approval", you MUST immediately call reviewApproval with the approval details (approval_id, source_agent, target_agent, data_type, sensitivity_reason) from the pending_approval object.

After the user approves (reviewApproval returns { approved: true }), you MUST call fulfillApproval with the same approval_id to retrieve the released data. Then present the data to the user in a clear, natural format.

If the user denies the approval, acknowledge it gracefully and let them know the request was denied.

Do NOT make up financial data. Always use the queryAgentNetwork action to get real data from the agent network.`}
          labels={{
            initial: chatStarted ? "" : `How can I help you today? Ask ${activePersona.name} anything.`,
            placeholder: "Ask your agent anything...",
          }}
        />
      </div>
    </div>
  );
}
