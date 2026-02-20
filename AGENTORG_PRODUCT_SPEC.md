# AgentOrg — Personal Business Agent Network

## Product Spec | AWS x Anthropic x Datadog GenAI Hackathon (Feb 20, 2025)

---

## One-Liner

Every employee gets a personal AI agent that can talk to other employees' agents to get work done — with approval gates and audit trails.

---

## Core Concept

Finance Manager asks their agent: _"Get me Q4 P&L from accounting."_

Their agent understands the request → routes it to the Accountant's agent → Accountant's agent pulls the data → approval gate fires → data flows back. Humans stay in the loop only when approval is needed.

---

## Hackathon Scope

### In Scope

- **2–3 pre-defined agent personas** (Finance Manager, Accountant, CEO) — no dynamic role creation
- **Agent-to-agent messaging** via orchestration layer
- **One happy-path workflow**: FM requests P&L → Accountant agent fulfills → approval gate → response delivered
- **Mock data layer** — fake P&L, fake invoices, no real integrations
- **Simple approval gate** — Accountant agent flags sensitive requests, simulates human-in-the-loop approval
- **Chat UI** — CopilotKit-powered interface with persona switcher to demo the flow

### Out of Scope

- Real auth / RBAC system
- Real financial data integrations
- Multi-tenant / multi-org
- Agent memory persistence across sessions
- Complex routing (3+ agent chains)

---

## Prize Track Alignment

### Required (Prize Eligibility)

| Requirement               | Integration                                                            |
| ------------------------- | ---------------------------------------------------------------------- |
| **Amazon Bedrock**        | All agent LLM calls go through Bedrock Claude                          |
| **Datadog Observability** | Every agent-to-agent hop is a traced span; LLM Observability dashboard |

### Bonus Tracks (Targeting)

| Track           | Integration                                                                 | Prize                     |
| --------------- | --------------------------------------------------------------------------- | ------------------------- |
| **CopilotKit**  | CoAgents-powered UI showing real-time agent state transitions               | Cash (from $12K pool)     |
| **Neo4j**       | Org hierarchy + permission edges as a graph; routing & auth = graph queries | Credits + Bose headphones |
| **Datadog MCP** | Agents self-monitor via Datadog MCP server                                  | Meta Glasses              |

### Not Targeting

| Track      | Reason                             |
| ---------- | ---------------------------------- |
| MiniMax    | No natural multimodal fit          |
| TestSprite | Testing layer, low ROI for 4 hours |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│              CopilotKit Frontend                  │
│         (CoAgents = agent-aware UI)               │
│    Persona switcher: FM | Accountant | CEO        │
└──────────────┬───────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│           Orchestrator (Python / FastAPI)          │
│  • Agent routing table                            │
│  • Approval queue state machine                   │
│  • Datadog tracing on every hop                   │
└──────┬────────────────┬──────────────────────────┘
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│  FM Agent   │  │ Acct Agent  │
│  (Bedrock   │  │ (Bedrock    │
│   Claude)   │  │  Claude)    │
└──────┬──────┘  └──────┬──────┘
       │                │
┌──────▼────────────────▼──────┐
│        Neo4j Graph DB         │
│  • Org hierarchy (nodes)      │
│  • Permission edges           │
│  • Data access policies       │
│                               │
│  "Can FM access Q4 margins?"  │
│  → MATCH (fm)-[:CAN_REQUEST]  │
│    ->(data) RETURN data       │
└──────────────────────────────┘
```

### Tech Stack

| Layer                 | Technology                                                   |
| --------------------- | ------------------------------------------------------------ |
| Frontend              | CopilotKit (CoAgents) + React                                |
| Orchestrator          | Python / FastAPI                                             |
| Agents                | Amazon Bedrock (Claude) — each agent = system prompt + tools |
| Permissions & Routing | Neo4j graph database                                         |
| Mock Data             | In-memory dict / JSON files                                  |
| Observability         | Datadog (`ddtrace`, LLM Observability, Dashboards)           |
| Approval Queue        | Simple state machine (pending → approved/denied → fulfilled) |

---

## Agent Design

Each agent is a Bedrock Claude invocation with:

| Component              | Details                                                         |
| ---------------------- | --------------------------------------------------------------- |
| **System prompt**      | Role definition, permissions, what they can/can't access        |
| **Tools**              | Role-specific functions (e.g., accountant has `pull_pnl()`)     |
| **Routing capability** | Can emit a `request_to_agent` action with target role + payload |
| **Approval gate**      | Checks sensitivity level before releasing data                  |

### Agent Definitions

#### Finance Manager Agent

- **Can request**: P&L, budget summaries, invoice status
- **Tools**: `request_from_agent(target, ask)`, `summarize_report()`
- **Personality**: Strategic, concise, wants high-level summaries

#### Accountant Agent

- **Can fulfill**: P&L pulls, invoice lookups, expense breakdowns
- **Tools**: `pull_pnl(quarter)`, `pull_invoices(filter)`, `check_approval_required()`
- **Gate**: Flags anything with revenue/margin data as "approval required"

#### CEO Agent (Stretch Goal)

- **Can request**: From anyone, sees everything
- **Purpose**: Adds a third node to demo multi-agent routing

---

## Demo Flow (What We Show Judges)

```
1. FM types: "I need the Q4 P&L statement with margin breakdown"
2. FM Agent parses intent → determines this needs Accountant
3. FM Agent sends structured request to Orchestrator
4. Orchestrator queries Neo4j: Does FM have permission? → YES
5. Orchestrator routes to Accountant Agent
6. Accountant Agent pulls mock data, detects margin data = sensitive
7. 🔒 APPROVAL GATE: Accountant gets notification
   "FM requesting Q4 margins — approve?"
8. Accountant approves (one click in UI)
9. Data flows back through Orchestrator → FM Agent
10. FM Agent summarizes: "Here's your Q4 P&L. Revenue up 12% QoQ..."
11. Audit log shows full chain of custody
12. Datadog dashboard shows the full trace across all hops
```

---

## 4-Hour Build Plan

Work is split between a **Backend Developer (BE)** and a **Frontend Developer (FE)** working in parallel.

| Time            | Backend Developer (BE)                                                                          | Frontend Developer (FE)                                                          |
| --------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **0:00 – 0:15** | Set up AWS/Bedrock, scaffold FastAPI backend, docker-compose up Neo4j                           | Scaffold CopilotKit + Next.js frontend, install deps, configure Tailwind         |
| **0:15 – 1:15** | Seed Neo4j org graph, verify Cypher queries. Build Strands agents (FM + Accountant) with mock tools | Build PersonaSwitcher, ChatPanel, define shared types + API client               |
| _1:15_          | _**Sync checkpoint:** Agree on API contract (chat request/response shape, SSE event schema)_    | |
| **1:15 – 2:15** | Build orchestrator routing + Neo4j permission check. Build approval queue. Wire SSE stream      | Build `useAgentSSE` hook + AgentStatusBar. Build ApprovalDialog + AuditTrail     |
| _2:15_          | _**Sync checkpoint:** BE confirms SSE stream is live; FE connects with real events_             | |
| **2:15 – 3:00** | **Integration (both):** Wire frontend to backend — chat flow + SSE + approval UI. End-to-end test: FM → Accountant → approval → response | |
| **3:00 – 3:45** | Add tracing spans, wire Datadog dashboard if time allows                                        | UI polish: loading states, error handling, styling                               |
| **3:45 – 4:00** | **Demo prep (both):** Final rehearsal, backup recording                                         | |

---

## Judging Pitch (30 Seconds)

> "Every employee gets a personal AI agent. Agents talk to each other so humans don't have to play telephone. Permissions live in a Neo4j graph — add a person, add a node, agents know what they can access. Every request is traced in Datadog so you see exactly who asked for what, when, and how long it took. Built on Bedrock, observable by default, and the UI shows agent collaboration in real-time through CopilotKit."

---

## Why This Wins Multiple Tracks

- **Main track**: Production-ready agent workflow on Bedrock with Datadog observability — checks the box
- **CopilotKit track**: CoAgent-powered UI where agent state is visible in real-time ("FM Agent → routing to Accountant Agent → awaiting approval")
- **Neo4j track**: The org graph IS the permission system. Not hardcoded — it's a knowledge graph. Add a person? Add a node. Change permissions? Update an edge. Agents adapt instantly.
- **Datadog track**: Every agent hop is a traced span. Dashboard shows request latency, approval bottleneck time, and LLM token usage per agent. Real observability story, not a checkbox.

---

## Risks & Mitigations

| Risk                                  | Mitigation                                                 |
| ------------------------------------- | ---------------------------------------------------------- |
| Agent-to-agent latency (2x LLM calls) | Use Haiku for routing decisions, Sonnet for generation     |
| Demo breaks mid-presentation          | Pre-record backup video; deterministic fallback responses  |
| Scope creep                           | Hard rule: if it's not in the demo flow, it doesn't exist  |
| Neo4j setup time                      | Pre-seed with a Cypher script, keep schema to 3 node types |
| CopilotKit learning curve             | Use their starter template, minimal customization          |
