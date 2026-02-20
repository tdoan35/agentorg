import type { ChatRequest, ChatResponse, Approval, AgentConfig } from "./types";

const BASE_URL = "/backend";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

export const api = {
  async chat(body: ChatRequest): Promise<ChatResponse> {
    const rawResponse = await fetchText("/invocations", {
      method: "POST",
      body: JSON.stringify({ prompt: body.message }),
    });

    // Clean up the response (remove thinking tags and quotes)
    let cleaned = rawResponse.replace(/^"|"$/g, "").replace(/\\n/g, "\n").replace(/\\"/g, '"');
    cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>\n?/, "").trim();

    // If the response is a JSON string, extract the message
    let finalMessage = cleaned;
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && parsed.message) {
        finalMessage = parsed.message;
      }
    } catch (e) {
      // Not JSON, use cleaned string as is
    }

    return {
      response: finalMessage,
      conversation_id: body.conversation_id || "default",
      agent: "assistant",
    };
  },

  getAgents() {
    return fetchJSON<AgentConfig[]>("/agents");
  },

  getAgent(slug: string) {
    return fetchJSON<AgentConfig>(`/agents/${slug}`);
  },

  updatePermissions(slug: string, permissions: AgentConfig["permissions"]) {
    return fetchJSON<AgentConfig>(`/agents/${slug}/permissions`, {
      method: "PUT",
      body: JSON.stringify(permissions),
    });
  },

  getApprovals(status?: string) {
    const query = status ? `?status=${status}` : "";
    return fetchJSON<Approval[]>(`/approvals${query}`);
  },

  approveRequest(id: string) {
    return fetchJSON<Approval>(`/approvals/${id}/approve`, { method: "POST" });
  },

  denyRequest(id: string) {
    return fetchJSON<Approval>(`/approvals/${id}/deny`, { method: "POST" });
  },
};
