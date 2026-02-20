import { create } from "zustand";
import { PERSONAS, type PersonaSlug, type Persona } from "./personas";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  agent?: string;
}

interface PersonaStore {
  activeSlug: PersonaSlug;
  activePersona: Persona;
  setActive: (slug: PersonaSlug) => void;
}

interface ChatStore {
  messages: ChatMessage[];
  conversationId: string | null;
  addMessage: (msg: ChatMessage) => void;
  setConversationId: (id: string) => void;
  clear: () => void;
}

export type { ChatMessage };

export const usePersonaStore = create<PersonaStore>((set) => ({
  activeSlug: "finance-manager",
  activePersona: PERSONAS["finance-manager"],
  setActive: (slug) =>
    set({ activeSlug: slug, activePersona: PERSONAS[slug] }),
}));

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  conversationId: null,
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  setConversationId: (id) => set({ conversationId: id }),
  clear: () => set({ messages: [], conversationId: null }),
}));
