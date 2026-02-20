export type PersonaSlug = "finance-manager" | "accountant" | "ceo";

export interface Persona {
  slug: PersonaSlug;
  name: string;
  role: string;
  description: string;
  icon: string;
  dotColor: string;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
  defaultPermissions: {
    dataAccess: string[];
    tools: string[];
    routing: string[];
  };
}

export const PERSONAS: Record<PersonaSlug, Persona> = {
  "finance-manager": {
    slug: "finance-manager",
    name: "fm_agent",
    role: "Finance Manager",
    description:
      "Requests financial data and summaries from other agents.",
    icon: "TrendingUp",
    dotColor: "#3B82F6",
    gradientFrom: "#3B82F6",
    gradientTo: "#1E40AF",
    iconColor: "#60A5FA",
    defaultPermissions: {
      dataAccess: ["pnl", "invoices", "budget"],
      tools: ["request_from_agent", "summarize_report"],
      routing: ["accountant"],
    },
  },
  accountant: {
    slug: "accountant",
    name: "acct_agent",
    role: "Accountant",
    description:
      "Fulfills data requests. Pulls P&L, invoices, and expenses. Gates sensitive data behind approvals.",
    icon: "Calculator",
    dotColor: "#4ADE80",
    gradientFrom: "#22C55E",
    gradientTo: "#14532D",
    iconColor: "#4ADE80",
    defaultPermissions: {
      dataAccess: ["pnl", "invoices", "expenses", "budget"],
      tools: ["pull_pnl", "pull_invoices", "check_approval_required"],
      routing: ["finance-manager"],
    },
  },
  ceo: {
    slug: "ceo",
    name: "ceo_agent",
    role: "CEO",
    description:
      "Full access across the organization. Can request data from any agent and sees everything.",
    icon: "Crown",
    dotColor: "#C084FC",
    gradientFrom: "#A855F7",
    gradientTo: "#3B0764",
    iconColor: "#C084FC",
    defaultPermissions: {
      dataAccess: ["pnl", "invoices", "expenses", "budget"],
      tools: ["request_from_agent", "summarize_report"],
      routing: ["accountant", "finance-manager"],
    },
  },
};

export const ALL_DATA_RESOURCES = ["pnl", "invoices", "budget", "expenses"];
export const ALL_TOOLS = [
  "request_from_agent",
  "summarize_report",
  "pull_pnl",
  "pull_invoices",
  "check_approval_required",
];
export const ALL_AGENTS: PersonaSlug[] = [
  "finance-manager",
  "accountant",
  "ceo",
];

export const PERSONA_SLUGS = Object.keys(PERSONAS) as PersonaSlug[];
