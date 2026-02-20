import { create } from "zustand";
import { PERSONAS, type PersonaSlug, type Persona } from "./personas";

interface PersonaStore {
  activeSlug: PersonaSlug;
  activePersona: Persona;
  setActive: (slug: PersonaSlug) => void;
}

export const usePersonaStore = create<PersonaStore>((set) => ({
  activeSlug: "finance-manager",
  activePersona: PERSONAS["finance-manager"],
  setActive: (slug) =>
    set({ activeSlug: slug, activePersona: PERSONAS[slug] }),
}));
