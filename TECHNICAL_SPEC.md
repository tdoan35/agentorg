# AgentOrg — Technical Specification

## AWS x Anthropic x Datadog GenAI Hackathon | Feb 20, 2025

---

## 1. System Overview

AgentOrg is a multi-agent system where employees interact through personal AI agents. Agents communicate via a central orchestrator, with permissions enforced through a Neo4j graph and sensitive requests gated behind human approval.

### Key Technical Decisions

| Decision              | Choice                                  | Rationale                                                    |
| --------------------- | --------------------------------------- | ------------------------------------------------------------ |
| Agent Framework       | AWS Strands Agents SDK                  | Native Bedrock integration, AWS-native for prize eligibility |
| Frontend              | CopilotKit (standard chat) + custom SSE | CopilotKit for prize track; SSE for real-time agent state    |
| Backend               | Python / FastAPI                        | Async support, Strands compatibility, fast to scaffold       |
| Graph DB              | Neo4j (Docker)                          | Local container, full Cypher support for prize track         |
| Realtime Transport    | Server-Sent Events (SSE)               | CopilotKit default, simple one-way streaming                 |
| Observability         | Datadog (plug-in-later)                 | Design tracing interfaces upfront, wire DD in final phase    |
| Deployment            | Local dev only                          | Minimize infra overhead during hackathon                     |
| Project Structure     | Monorepo                                | Single repo, `/frontend` + `/backend`                        |

---

## 2. Repository Structure

```
agentorg/
├── AGENTORG_PRODUCT_SPEC.md
├── TECHNICAL_SPEC.md
├── docker-compose.yml              # Neo4j + (optional) services
├── backend/
│   ├── pyproject.toml               # Python deps (uv/pip)
│   ├── .env.example                 # Env var template
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint
│   │   ├── config.py                # Settings (Bedrock region, Neo4j URI, DD keys)
│   │   ├── orchestrator/
│   │   │   ├── router.py            # Agent routing logic
│   │   │   ├── approval.py          # Approval queue state machine
│   │   │   └── events.py            # SSE event stream manager
│   │   ├── agents/
│   │   │   ├── base.py              # Shared Strands agent factory
│   │   │   ├── finance_manager.py   # FM agent definition
│   │   │   ├── accountant.py        # Accountant agent definition
│   │   │   └── ceo.py               # CEO agent (stretch)
│   │   ├── tools/
│   │   │   ├── request_from_agent.py
│   │   │   ├── pull_pnl.py
│   │   │   ├── pull_invoices.py
│   │   │   ├── summarize_report.py
│   │   │   └── check_approval.py
│   │   ├── graph/
│   │   │   ├── client.py            # Neo4j driver wrapper
│   │   │   ├── queries.py           # Cypher query library
│   │   │   └── seed.py              # Seed script for org graph
│   │   ├── mock_data/
│   │   │   ├── pnl.json             # Mock P&L data
│   │   │   └── invoices.json        # Mock invoice data
│   │   └── tracing/
│   │       ├── middleware.py         # FastAPI middleware for trace context
│   │       └── spans.py             # Span helpers (DD-ready interface)
│   └── tests/
│       └── ...
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Main chat page
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx        # CopilotKit chat wrapper
│   │   │   ├── PersonaSwitcher.tsx  # FM | Accountant | CEO tabs
│   │   │   ├── AgentStatusBar.tsx   # Real-time agent state display
│   │   │   ├── ApprovalDialog.tsx   # Approval gate UI
│   │   │   └── AuditTrail.tsx       # Request chain visualization
│   │   ├── hooks/
│   │   │   ├── useAgentSSE.ts       # SSE connection hook
│   │   │   └── useApproval.ts       # Approval state hook
│   │   └── lib/
│   │       ├── api.ts               # Backend API client
│   │       └── types.ts             # Shared TypeScript types
│   └── ...
└── scripts/
    ├── seed-neo4j.sh                # Convenience script to seed graph
    └── start-dev.sh                 # Start all services locally
```

---

## 3. Agent Architecture (AWS Strands)

### 3.1 Agent Factory Pattern

Each agent is instantiated via a shared factory that configures the Strands Agent with a Bedrock model, system prompt, and tool set.

```python
# backend/app/agents/base.py
from strands import Agent
from strands.models.bedrock import BedrockModel

def create_agent(
    system_prompt: str,
    tools: list,
    model_id: str = "us.anthropic.claude-sonnet-4-20250514"
) -> Agent:
    model = BedrockModel(
        model_id=model_id,
        region_name="us-east-1"
    )
    return Agent(
        model=model,
        system_prompt=system_prompt,
        tools=tools
    )
```

### 3.2 Agent Definitions

#### Finance Manager Agent

```python
# System prompt (abbreviated)
"""
You are the Finance Manager's personal AI agent.
You can request financial data from other agents in the organization.
You summarize data into executive-ready formats.
You NEVER fabricate financial data — always request it from the appropriate agent.

Available actions:
- Request data from the Accountant agent
- Summarize financial reports you receive

When you need data you don't have, use the request_from_agent tool
with target="accountant" and a clear description of what you need.
"""

# Tools: request_from_agent, summarize_report
```

#### Accountant Agent

```python
# System prompt (abbreviated)
"""
You are the Accountant's personal AI agent.
You have access to financial data systems (P&L, invoices, expenses).
You fulfill data requests from authorized agents.
You MUST flag sensitive data (revenue, margins, salaries) for human approval
before releasing it.

When you receive a request:
1. Check if the requesting agent has permission (via the orchestrator)
2. Pull the requested data using your tools
3. If the data contains sensitive fields, trigger the approval gate
4. Return the data only after approval is granted
"""

# Tools: pull_pnl, pull_invoices, check_approval_required
```

#### CEO Agent (Stretch Goal)

```python
# System prompt: Can request from any agent, sees everything.
# Tools: request_from_agent, summarize_report
# Permission level: unrestricted read access in Neo4j graph
```

### 3.3 Tool Definitions

Each tool is a Python function decorated with `@tool` from Strands:

```python
from strands.types.tools import tool

@tool
def pull_pnl(quarter: str, year: int = 2024) -> dict:
    """Pull the P&L statement for a given quarter.

    Args:
        quarter: The quarter to pull (Q1, Q2, Q3, Q4)
        year: The fiscal year (default 2024)

    Returns:
        P&L data including revenue, COGS, operating expenses, and net income.
    """
    # Load from mock_data/pnl.json
    ...
```

| Tool                    | Agent       | Description                                      |
| ----------------------- | ----------- | ------------------------------------------------ |
| `request_from_agent`    | FM, CEO     | Sends a structured request to another agent       |
| `summarize_report`      | FM, CEO     | Takes raw data and produces an executive summary  |
| `pull_pnl`              | Accountant  | Returns mock P&L data for a given quarter         |
| `pull_invoices`         | Accountant  | Returns mock invoice data with optional filters   |
| `check_approval_required` | Accountant | Checks if data fields require approval before release |

---

## 4. Orchestrator Design

The orchestrator is the central nervous system — it routes messages between agents, enforces permissions via Neo4j, and manages the approval queue.

### 4.1 API Endpoints

```
POST   /api/chat                    # User sends a message to their active agent
GET    /api/chat/stream             # SSE stream for real-time agent state
POST   /api/agents/request          # Agent-to-agent request (internal)
GET    /api/approvals               # List pending approvals
POST   /api/approvals/{id}/approve  # Approve a pending request
POST   /api/approvals/{id}/deny     # Deny a pending request
GET    /api/audit                   # Audit trail for a conversation
```

### 4.2 Chat Flow (POST /api/chat)

```python
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    1. Identify the active persona (FM, Accountant, CEO)
    2. Retrieve or create the corresponding Strands agent
    3. Pass the user message to the agent
    4. If the agent invokes request_from_agent:
       a. Orchestrator intercepts the tool call
       b. Queries Neo4j for permission check
       c. Routes to the target agent
       d. If approval gate triggers, pause and notify
       e. On approval, resume the data flow
    5. Stream state transitions via SSE
    6. Return the final response
    """
```

### 4.3 Routing Logic

```python
# backend/app/orchestrator/router.py

class AgentRouter:
    """Routes inter-agent requests based on Neo4j permissions."""

    async def route_request(self, source: str, target: str, payload: dict) -> dict:
        # 1. Check permission in Neo4j
        has_permission = await self.graph.check_permission(source, target, payload["data_type"])
        if not has_permission:
            return {"status": "denied", "reason": "Insufficient permissions"}

        # 2. Emit SSE event: "Routing to {target} agent..."
        await self.events.emit(source, AgentEvent.ROUTING, target=target)

        # 3. Invoke the target agent
        target_agent = self.agents[target]
        result = target_agent(payload["message"])

        # 4. Check if approval is needed
        if result.requires_approval:
            approval = await self.approval_queue.create(source, target, result)
            await self.events.emit(source, AgentEvent.AWAITING_APPROVAL, approval_id=approval.id)
            return {"status": "pending_approval", "approval_id": approval.id}

        # 5. Return result
        await self.events.emit(source, AgentEvent.FULFILLED)
        return {"status": "fulfilled", "data": result.data}
```

### 4.4 Approval Queue State Machine

```
                 ┌─────────┐
     create()──▶ │ PENDING │
                 └────┬────┘
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
      ┌──────────┐       ┌──────────┐
      │ APPROVED │       │  DENIED  │
      └────┬─────┘       └──────────┘
           │
           ▼
     ┌───────────┐
     │ FULFILLED │  (data delivered to requesting agent)
     └───────────┘
```

```python
# backend/app/orchestrator/approval.py
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import uuid

class ApprovalStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    FULFILLED = "fulfilled"

@dataclass
class ApprovalRequest:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    source_agent: str = ""
    target_agent: str = ""
    data_type: str = ""
    sensitivity_reason: str = ""
    status: ApprovalStatus = ApprovalStatus.PENDING
    payload: dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    resolved_at: datetime | None = None

class ApprovalQueue:
    """In-memory approval queue. Stores pending requests."""

    def __init__(self):
        self._queue: dict[str, ApprovalRequest] = {}

    def create(self, source: str, target: str, data_type: str, payload: dict, reason: str) -> ApprovalRequest:
        req = ApprovalRequest(
            source_agent=source,
            target_agent=target,
            data_type=data_type,
            sensitivity_reason=reason,
            payload=payload
        )
        self._queue[req.id] = req
        return req

    def approve(self, approval_id: str) -> ApprovalRequest:
        req = self._queue[approval_id]
        req.status = ApprovalStatus.APPROVED
        req.resolved_at = datetime.utcnow()
        return req

    def deny(self, approval_id: str) -> ApprovalRequest:
        req = self._queue[approval_id]
        req.status = ApprovalStatus.DENIED
        req.resolved_at = datetime.utcnow()
        return req
```

---

## 5. Neo4j Graph Schema

### 5.1 Node Types

```cypher
// Persons (agent owners)
(:Person {id: "fm-001", name: "Alex Chen", role: "finance_manager"})
(:Person {id: "acct-001", name: "Jordan Lee", role: "accountant"})
(:Person {id: "ceo-001", name: "Sam Rivera", role: "ceo"})

// Data Resources
(:DataResource {id: "pnl", name: "P&L Statement", sensitivity: "high"})
(:DataResource {id: "invoices", name: "Invoice Records", sensitivity: "low"})
(:DataResource {id: "expenses", name: "Expense Breakdown", sensitivity: "medium"})
(:DataResource {id: "budget", name: "Budget Summary", sensitivity: "medium"})
```

### 5.2 Relationship Types

```cypher
// Org hierarchy
(ceo)-[:MANAGES]->(fm)
(fm)-[:MANAGES]->(acct)

// Data ownership — who can fulfill requests for this data
(acct)-[:OWNS_DATA]->(pnl)
(acct)-[:OWNS_DATA]->(invoices)
(acct)-[:OWNS_DATA]->(expenses)

// Request permissions — who can request what
(fm)-[:CAN_REQUEST]->(pnl)
(fm)-[:CAN_REQUEST]->(invoices)
(fm)-[:CAN_REQUEST]->(budget)
(ceo)-[:CAN_REQUEST]->(pnl)
(ceo)-[:CAN_REQUEST]->(invoices)
(ceo)-[:CAN_REQUEST]->(expenses)
(ceo)-[:CAN_REQUEST]->(budget)

// Approval requirements — which data needs approval before release
(pnl)-[:REQUIRES_APPROVAL {reason: "Contains revenue and margin data"}]->(:ApprovalPolicy)
(expenses)-[:REQUIRES_APPROVAL {reason: "Contains salary information"}]->(:ApprovalPolicy)
```

### 5.3 Key Cypher Queries

```cypher
// Permission check: Can FM request P&L?
MATCH (requester:Person {role: $requester_role})-[:CAN_REQUEST]->(data:DataResource {id: $data_id})
RETURN count(requester) > 0 AS has_permission

// Find data owner: Who fulfills P&L requests?
MATCH (owner:Person)-[:OWNS_DATA]->(data:DataResource {id: $data_id})
RETURN owner.role AS fulfiller

// Approval check: Does this data need approval?
MATCH (data:DataResource {id: $data_id})-[:REQUIRES_APPROVAL]->(policy:ApprovalPolicy)
RETURN data.sensitivity AS sensitivity, policy IS NOT NULL AS needs_approval

// Full routing query: Given a request, find the path
MATCH (requester:Person {role: $requester_role})-[:CAN_REQUEST]->(data:DataResource {id: $data_id})
MATCH (owner:Person)-[:OWNS_DATA]->(data)
OPTIONAL MATCH (data)-[approval:REQUIRES_APPROVAL]->(policy:ApprovalPolicy)
RETURN owner.role AS target_agent,
       data.sensitivity AS sensitivity,
       approval IS NOT NULL AS requires_approval,
       approval.reason AS approval_reason
```

### 5.4 Seed Script

```python
# backend/app/graph/seed.py
SEED_CYPHER = """
// Clear existing data
MATCH (n) DETACH DELETE n;

// Create persons
CREATE (fm:Person {id: 'fm-001', name: 'Alex Chen', role: 'finance_manager'})
CREATE (acct:Person {id: 'acct-001', name: 'Jordan Lee', role: 'accountant'})
CREATE (ceo:Person {id: 'ceo-001', name: 'Sam Rivera', role: 'ceo'})

// Create data resources
CREATE (pnl:DataResource {id: 'pnl', name: 'P&L Statement', sensitivity: 'high'})
CREATE (invoices:DataResource {id: 'invoices', name: 'Invoice Records', sensitivity: 'low'})
CREATE (expenses:DataResource {id: 'expenses', name: 'Expense Breakdown', sensitivity: 'medium'})
CREATE (budget:DataResource {id: 'budget', name: 'Budget Summary', sensitivity: 'medium'})

// Create approval policy
CREATE (ap:ApprovalPolicy {id: 'default'})

// Org hierarchy
CREATE (ceo)-[:MANAGES]->(fm)
CREATE (fm)-[:MANAGES]->(acct)

// Data ownership
CREATE (acct)-[:OWNS_DATA]->(pnl)
CREATE (acct)-[:OWNS_DATA]->(invoices)
CREATE (acct)-[:OWNS_DATA]->(expenses)
CREATE (acct)-[:OWNS_DATA]->(budget)

// Request permissions
CREATE (fm)-[:CAN_REQUEST]->(pnl)
CREATE (fm)-[:CAN_REQUEST]->(invoices)
CREATE (fm)-[:CAN_REQUEST]->(budget)
CREATE (ceo)-[:CAN_REQUEST]->(pnl)
CREATE (ceo)-[:CAN_REQUEST]->(invoices)
CREATE (ceo)-[:CAN_REQUEST]->(expenses)
CREATE (ceo)-[:CAN_REQUEST]->(budget)

// Approval requirements
CREATE (pnl)-[:REQUIRES_APPROVAL {reason: 'Contains revenue and margin data'}]->(ap)
CREATE (expenses)-[:REQUIRES_APPROVAL {reason: 'Contains salary information'}]->(ap)
"""
```

---

## 6. SSE Event Stream

### 6.1 Event Types

```typescript
type AgentEventType =
  | "agent:thinking"        // Agent is processing
  | "agent:routing"         // Routing request to another agent
  | "agent:permission_check"// Checking Neo4j permissions
  | "agent:awaiting_approval"// Blocked on human approval
  | "agent:approved"        // Approval granted
  | "agent:denied"          // Approval denied
  | "agent:fulfilled"       // Data delivered
  | "agent:responding"      // Agent composing final response
  | "agent:error"           // Something went wrong

interface AgentEvent {
  type: AgentEventType;
  agent: string;            // Which agent emitted this
  target?: string;          // Target agent (for routing events)
  message?: string;         // Human-readable status
  approval_id?: string;     // For approval-related events
  data?: any;               // Payload (for fulfilled events)
  timestamp: string;        // ISO 8601
  trace_id?: string;        // For Datadog correlation
}
```

### 6.2 SSE Endpoint

```python
# backend/app/orchestrator/events.py
from fastapi import Request
from sse_starlette.sse import EventSourceResponse

class EventStreamManager:
    """Manages per-conversation SSE streams."""

    def __init__(self):
        self._streams: dict[str, asyncio.Queue] = {}

    async def emit(self, conversation_id: str, event_type: str, **data):
        if conversation_id in self._streams:
            await self._streams[conversation_id].put({
                "type": event_type,
                "timestamp": datetime.utcnow().isoformat(),
                **data
            })

    async def subscribe(self, conversation_id: str):
        queue = asyncio.Queue()
        self._streams[conversation_id] = queue
        try:
            while True:
                event = await queue.get()
                yield {"event": event["type"], "data": json.dumps(event)}
        finally:
            del self._streams[conversation_id]

@app.get("/api/chat/stream")
async def stream(conversation_id: str, request: Request):
    return EventSourceResponse(event_manager.subscribe(conversation_id))
```

---

## 7. Frontend Architecture

### 7.1 CopilotKit Integration

CopilotKit is used as the chat UI shell. Since we're using Strands (not LangGraph), we use CopilotKit's standard `<CopilotChat>` component and supplement it with custom SSE-driven state indicators.

```tsx
// Simplified page structure
<CopilotKit runtimeUrl="/api/copilotkit">
  <div className="flex h-screen">
    <Sidebar>
      <PersonaSwitcher active={persona} onChange={setPersona} />
      <AuditTrail events={events} />
    </Sidebar>
    <Main>
      <AgentStatusBar status={agentStatus} />
      <CopilotChat />
      <ApprovalDialog
        pending={pendingApprovals}
        onApprove={handleApprove}
        onDeny={handleDeny}
      />
    </Main>
  </div>
</CopilotKit>
```

### 7.2 Key Components

| Component           | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `PersonaSwitcher`   | Tabs to switch between FM, Accountant, CEO personas                  |
| `AgentStatusBar`    | Animated bar showing agent state ("Routing to Accountant...", etc.)   |
| `ApprovalDialog`    | Modal that appears when the Accountant persona receives an approval request |
| `AuditTrail`        | Sidebar panel showing the chain of events for the current conversation |
| `ChatPanel`         | CopilotKit `<CopilotChat>` wrapper with persona-aware styling        |

### 7.3 SSE Hook

```typescript
// frontend/src/hooks/useAgentSSE.ts
export function useAgentSSE(conversationId: string) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<AgentEventType>("idle");

  useEffect(() => {
    const source = new EventSource(
      `/api/chat/stream?conversation_id=${conversationId}`
    );

    source.onmessage = (e) => {
      const event: AgentEvent = JSON.parse(e.data);
      setEvents(prev => [...prev, event]);
      setStatus(event.type);
    };

    return () => source.close();
  }, [conversationId]);

  return { events, status };
}
```

---

## 8. Mock Data

### 8.1 P&L Statement (mock_data/pnl.json)

```json
{
  "Q4_2024": {
    "period": "Q4 2024",
    "revenue": 4250000,
    "cost_of_goods_sold": 1700000,
    "gross_profit": 2550000,
    "operating_expenses": {
      "salaries": 850000,
      "marketing": 320000,
      "rent": 125000,
      "software": 95000,
      "other": 60000
    },
    "total_operating_expenses": 1450000,
    "operating_income": 1100000,
    "interest_expense": 45000,
    "tax_expense": 263750,
    "net_income": 791250,
    "margins": {
      "gross_margin_pct": 60.0,
      "operating_margin_pct": 25.9,
      "net_margin_pct": 18.6
    },
    "qoq_change": {
      "revenue_pct": 12.3,
      "net_income_pct": 8.7
    }
  }
}
```

### 8.2 Invoices (mock_data/invoices.json)

```json
{
  "invoices": [
    {
      "id": "INV-2024-0847",
      "vendor": "CloudServe Inc.",
      "amount": 12500.00,
      "status": "paid",
      "due_date": "2024-11-15",
      "category": "software"
    },
    {
      "id": "INV-2024-0923",
      "vendor": "Office Solutions Ltd.",
      "amount": 3200.00,
      "status": "pending",
      "due_date": "2024-12-30",
      "category": "office_supplies"
    },
    {
      "id": "INV-2024-1001",
      "vendor": "MarketBoost Agency",
      "amount": 45000.00,
      "status": "paid",
      "due_date": "2024-12-15",
      "category": "marketing"
    }
  ]
}
```

---

## 9. Observability Design (Datadog-Ready)

### 9.1 Tracing Interface

All tracing is abstracted behind a simple interface. During development, it logs to stdout. When Datadog is wired up, the implementation swaps to `ddtrace`.

```python
# backend/app/tracing/spans.py
from contextlib import contextmanager
import logging
import uuid

logger = logging.getLogger("agentorg.tracing")

class TracingBackend:
    """Abstract tracing interface. Swap implementation for Datadog."""

    @contextmanager
    def span(self, operation_name: str, tags: dict = None):
        trace_id = str(uuid.uuid4())[:8]
        logger.info(f"[SPAN START] {operation_name} trace={trace_id} tags={tags}")
        try:
            yield {"trace_id": trace_id}
        finally:
            logger.info(f"[SPAN END] {operation_name} trace={trace_id}")

# When Datadog is ready, replace with:
# from ddtrace import tracer
# class DatadogTracingBackend:
#     @contextmanager
#     def span(self, operation_name, tags=None):
#         with tracer.trace(operation_name, service="agentorg") as span:
#             for k, v in (tags or {}).items():
#                 span.set_tag(k, v)
#             yield {"trace_id": span.trace_id}

tracing = TracingBackend()
```

### 9.2 Traced Operations

| Span Name                      | Tags                                             | Where                  |
| ------------------------------ | ------------------------------------------------ | ---------------------- |
| `agentorg.chat`                | `persona`, `conversation_id`                     | POST /api/chat         |
| `agentorg.agent.invoke`        | `agent_role`, `model_id`                         | Strands agent call     |
| `agentorg.routing.permission`  | `source`, `target`, `data_type`, `result`        | Neo4j permission check |
| `agentorg.routing.dispatch`    | `source`, `target`                               | Agent-to-agent routing |
| `agentorg.approval.create`     | `source`, `target`, `data_type`, `sensitivity`   | Approval queue create  |
| `agentorg.approval.resolve`    | `approval_id`, `result` (approved/denied)        | Approval resolution    |
| `agentorg.tool.invoke`         | `tool_name`, `agent_role`                        | Any tool execution     |

### 9.3 Datadog Dashboard (Target Panels)

When wired up, the dashboard will show:

1. **Agent Request Flow** — Trace waterfall showing the full chain: FM → Orchestrator → Neo4j → Accountant → Approval → Response
2. **Approval Queue Depth** — Gauge showing pending approval count over time
3. **Agent Latency by Role** — Bar chart of p50/p95 latency per agent
4. **LLM Token Usage** — Tokens in/out per agent per request (from Bedrock metrics)
5. **Permission Denied Rate** — Counter of rejected permission checks

---

## 10. End-to-End Request Lifecycle

```
User (as FM)                    Frontend                   Backend
     │                             │                          │
     │  "Get me Q4 P&L"           │                          │
     │────────────────────────────▶│                          │
     │                             │  POST /api/chat          │
     │                             │─────────────────────────▶│
     │                             │                          │ ① Create span: agentorg.chat
     │                             │                          │ ② Invoke FM Agent (Strands/Bedrock)
     │                             │  SSE: agent:thinking     │
     │                             │◀─────────────────────────│
     │                             │                          │ ③ FM Agent calls request_from_agent(target="accountant")
     │                             │                          │ ④ Orchestrator intercepts tool call
     │                             │                          │ ⑤ Neo4j: MATCH (fm)-[:CAN_REQUEST]->(pnl) → YES
     │                             │  SSE: agent:routing      │
     │                             │◀─────────────────────────│
     │                             │                          │ ⑥ Invoke Accountant Agent
     │                             │                          │ ⑦ Accountant calls pull_pnl("Q4") → gets data
     │                             │                          │ ⑧ Accountant calls check_approval_required → YES (margins)
     │                             │  SSE: awaiting_approval  │
     │                             │◀─────────────────────────│
     │                             │                          │ ⑨ Approval request created
     │  [Switches to Accountant]   │                          │
     │  [Sees approval dialog]     │                          │
     │  [Clicks "Approve"]         │                          │
     │────────────────────────────▶│                          │
     │                             │  POST /approve/{id}      │
     │                             │─────────────────────────▶│
     │                             │                          │ ⑩ Approval resolved
     │                             │  SSE: agent:approved     │
     │                             │◀─────────────────────────│
     │                             │                          │ ⑪ Data flows back to FM Agent
     │                             │                          │ ⑫ FM Agent calls summarize_report()
     │                             │  SSE: agent:responding   │
     │                             │◀─────────────────────────│
     │                             │                          │ ⑬ Final response returned
     │                             │  SSE: agent:fulfilled    │
     │  "Q4 P&L: Revenue up 12%"  │◀─────────────────────────│
     │◀────────────────────────────│                          │
```

---

## 11. Configuration & Environment

```env
# backend/.env.example

# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=agentorg-hack

# Datadog (plug in later)
DD_SERVICE=agentorg
DD_ENV=hackathon
DD_API_KEY=
DD_AGENT_HOST=localhost

# App
APP_PORT=8000
FRONTEND_URL=http://localhost:3000
```

---

## 12. Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  neo4j:
    image: neo4j:5-community
    ports:
      - "7474:7474"   # Browser
      - "7687:7687"   # Bolt
    environment:
      NEO4J_AUTH: neo4j/agentorg-hack
    volumes:
      - neo4j_data:/data

volumes:
  neo4j_data:
```

---

## 13. Dependencies

### Backend (Python)

```
strands-agents              # AWS Strands Agents SDK
strands-agents-bedrock      # Bedrock model provider
fastapi                     # Web framework
uvicorn                     # ASGI server
sse-starlette               # SSE support for FastAPI
neo4j                       # Neo4j Python driver
pydantic                    # Data validation
python-dotenv               # Env var loading
ddtrace                     # Datadog tracing (plug in later)
```

### Frontend (Node)

```
@copilotkit/react-core      # CopilotKit core
@copilotkit/react-ui        # CopilotKit UI components
next                        # Next.js framework
react                       # React
tailwindcss                 # Styling
```

---

## 14. Build Order (Recommended)

This is the suggested implementation sequence for the hackathon:

| Phase | Task                                             | Est. Time |
| ----- | ------------------------------------------------ | --------- |
| 1     | Scaffold monorepo, install deps, docker-compose up Neo4j | 15 min    |
| 2     | Seed Neo4j graph, verify Cypher queries          | 15 min    |
| 3     | Build Strands agents (FM + Accountant) with mock tools | 30 min    |
| 4     | Build orchestrator: routing + permission check    | 30 min    |
| 5     | Build approval queue state machine               | 15 min    |
| 6     | Wire SSE event stream                            | 15 min    |
| 7     | End-to-end test: FM → Accountant → approval → response | 15 min    |
| 8     | Scaffold frontend: CopilotKit + persona switcher  | 20 min    |
| 9     | Wire frontend to backend SSE + approval UI        | 25 min    |
| 10    | Add tracing spans, wire Datadog if time allows    | 15 min    |
| 11    | Polish, demo rehearsal, backup recording          | 15 min    |

**Total: ~3.5 hours** — leaves 30 min buffer.
