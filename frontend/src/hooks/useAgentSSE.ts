"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgentEvent, AgentEventType } from "@/lib/types";

export function useAgentSSE(conversationId: string | null) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<AgentEventType | "idle">("idle");

  useEffect(() => {
    if (!conversationId) return;

    const source = new EventSource(
      `/backend/chat/stream?conversation_id=${conversationId}`
    );

    source.addEventListener("message", (e) => {
      const event: AgentEvent = JSON.parse(e.data);
      setEvents((prev) => [...prev, event]);
      setStatus(event.type);
    });

    source.addEventListener("error", () => {
      setStatus("idle");
    });

    return () => source.close();
  }, [conversationId]);

  const reset = useCallback(() => {
    setEvents([]);
    setStatus("idle");
  }, []);

  return { events, status, reset };
}
