export type AgentEventType =
  | "agent:thinking"
  | "agent:routing"
  | "agent:permission_check"
  | "agent:awaiting_approval"
  | "agent:approved"
  | "agent:denied"
  | "agent:fulfilled"
  | "agent:responding"
  | "agent:error";

export interface AgentEvent {
  type: AgentEventType;
  agent: string;
  target?: string;
  message?: string;
  approval_id?: string;
  data?: unknown;
  timestamp: string;
  trace_id?: string;
}

export interface ChatRequest {
  message: string;
  persona: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  agent: string;
  trace_id?: string;
}

export interface Approval {
  id: string;
  source_agent: string;
  target_agent: string;
  data_type: string;
  sensitivity_reason: string;
  status: "pending" | "approved" | "denied" | "fulfilled";
  created_at: string;
  resolved_at?: string;
}

export interface AgentConfig {
  slug: string;
  name: string;
  role: string;
  description: string;
  permissions: {
    dataAccess: string[];
    tools: string[];
    routing: string[];
  };
}
