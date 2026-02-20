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

export const api = {
  chat(body: ChatRequest) {
    return fetchJSON<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });
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
