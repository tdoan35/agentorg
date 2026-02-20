from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# ── Chat ────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    persona: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    agent: str
    trace_id: Optional[str] = None


# ── Approvals ───────────────────────────────────────────────────────────
class ApprovalOut(BaseModel):
    id: str
    source_agent: str
    target_agent: str
    data_type: str
    sensitivity_reason: str
    status: Literal["pending", "approved", "denied", "fulfilled"]
    created_at: str
    resolved_at: Optional[str] = None


# ── Agent Config ────────────────────────────────────────────────────────
class PermissionsBlock(BaseModel):
    dataAccess: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    routing: list[str] = Field(default_factory=list)


class AgentConfigOut(BaseModel):
    slug: str
    name: str
    role: str
    description: str
    permissions: PermissionsBlock
