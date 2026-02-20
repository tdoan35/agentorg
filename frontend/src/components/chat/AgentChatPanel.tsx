"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useChatStore } from "@/lib/store";
import type { Persona } from "@/lib/personas";
import type { ChatResponse, AgentEvent } from "@/lib/types";

interface AgentChatPanelProps {
  persona: Persona;
  events: AgentEvent[];
}

export function AgentChatPanel({ persona, events }: AgentChatPanelProps) {
  const { messages, conversationId, addMessage, setConversationId } =
    useChatStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, events]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      addMessage({ id: crypto.randomUUID(), role: "user", content: text });
      setInput("");
      setIsLoading(true);

      try {
        const res: ChatResponse = await api.chat({
          message: text,
          persona: persona.slug,
          conversation_id: conversationId ?? undefined,
        });

        if (!conversationId && res.conversation_id) {
          setConversationId(res.conversation_id);
        }

        addMessage({
          id: crypto.randomUUID(),
          role: "agent",
          content: res.response,
          agent: res.agent,
        });
      } catch (err) {
        addMessage({
          id: crypto.randomUUID(),
          role: "agent",
          content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
        });
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, persona.slug, conversationId, addMessage, setConversationId],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Active SSE events (filter out idle/keepalive)
  const activeEvents = events.filter(
    (e) => e.type !== ("keepalive" as string) && e.type !== ("idle" as string),
  );

  return (
    <div className="w-full max-w-[720px] mt-8 flex flex-col bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden h-[460px]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !isLoading && (
          <p className="text-sm text-[var(--text-tertiary)] text-center mt-8">
            Send a message to start a conversation with {persona.name}.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--bg-input)] text-[var(--text-primary)]"
              }`}
            >
              {msg.role === "agent" && msg.agent && (
                <span className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1 font-medium">
                  {msg.agent}
                </span>
              )}
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
          </div>
        ))}

        {/* SSE events during loading */}
        {isLoading && activeEvents.length > 0 && (
          <div className="flex justify-start">
            <div className="space-y-1">
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
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && activeEvents.length === 0 && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-[var(--bg-input)] rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-tertiary)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {persona.name} is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[var(--border-subtle)] p-3 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your agent anything..."
          disabled={isLoading}
          className="flex-1 bg-[var(--bg-input)] text-sm text-white placeholder:text-[var(--text-muted)] rounded-lg px-3.5 py-2.5 border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </form>
    </div>
  );
}
