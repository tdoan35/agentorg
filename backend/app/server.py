"""FastAPI server — the main entry point for the AgentOrg backend."""
from __future__ import annotations

import asyncio
import json
import logging
import sys
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from app.agents import AGENT_SPECS
from app.config import get_settings
from app.models import AgentConfigOut, ApprovalOut, ChatRequest, ChatResponse, PermissionsBlock
from app.orchestrator.approval import approval_queue
from app.orchestrator.events import event_manager
from app.orchestrator.router import orchestrator
from app.tracing.middleware import TracingMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("AgentOrg API starting up...")
    try:
        from app.graph.client import get_driver
        get_driver()
        logger.info("Neo4j connected")
    except Exception as e:
        logger.warning("Neo4j not available — running without graph permissions: %s", e)
    yield
    # Shutdown
    try:
        from app.graph.client import close_driver
        close_driver()
    except Exception:
        pass
    logger.info("AgentOrg API shut down")


app = FastAPI(title="AgentOrg API", version="0.1.0", lifespan=lifespan)

# ── Middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TracingMiddleware)


# ── Health ──────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "agentorg-api"}


# ── Chat ────────────────────────────────────────────────────────────────
@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    return await orchestrator.handle_chat(
        message=req.message,
        persona=req.persona,
        conversation_id=req.conversation_id,
    )


# ── SSE Stream ──────────────────────────────────────────────────────────
@app.get("/api/chat/stream")
async def chat_stream(conversation_id: str = Query(...)):
    queue = event_manager.subscribe(conversation_id)

    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {"data": json.dumps(event)}
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield {"data": json.dumps({"type": "keepalive"})}
        except asyncio.CancelledError:
            pass
        finally:
            event_manager.unsubscribe(conversation_id, queue)

    return EventSourceResponse(event_generator())


# ── Agents ──────────────────────────────────────────────────────────────
@app.get("/api/agents", response_model=list[AgentConfigOut])
async def list_agents():
    return [
        AgentConfigOut(
            slug=spec.slug,
            name=spec.name,
            role=spec.role,
            description=spec.description,
            permissions=PermissionsBlock(**spec.permissions_dict()),
        )
        for spec in AGENT_SPECS.values()
    ]


@app.get("/api/agents/{slug}", response_model=AgentConfigOut)
async def get_agent(slug: str):
    spec = AGENT_SPECS.get(slug)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Agent '{slug}' not found")
    return AgentConfigOut(
        slug=spec.slug,
        name=spec.name,
        role=spec.role,
        description=spec.description,
        permissions=PermissionsBlock(**spec.permissions_dict()),
    )


@app.put("/api/agents/{slug}/permissions", response_model=AgentConfigOut)
async def update_permissions(slug: str, permissions: PermissionsBlock):
    spec = AGENT_SPECS.get(slug)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Agent '{slug}' not found")
    spec.data_access = permissions.dataAccess
    spec.tool_names = permissions.tools
    spec.routing = permissions.routing
    return AgentConfigOut(
        slug=spec.slug,
        name=spec.name,
        role=spec.role,
        description=spec.description,
        permissions=PermissionsBlock(**spec.permissions_dict()),
    )


# ── Approvals ───────────────────────────────────────────────────────────
@app.get("/api/approvals", response_model=list[ApprovalOut])
async def list_approvals(status: Optional[str] = Query(None)):
    return approval_queue.list_by_status(status)


@app.post("/api/approvals/{approval_id}/approve", response_model=ApprovalOut)
async def approve_request(approval_id: str):
    req = approval_queue.approve(approval_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Approval request not found")

    await event_manager.emit(
        req.conversation_id, "agent:approved", req.source_agent,
        target=req.target_agent,
        approval_id=req.id,
        message=f"Request for {req.data_type} has been approved",
    )
    return req.to_dict()


@app.post("/api/approvals/{approval_id}/deny", response_model=ApprovalOut)
async def deny_request(approval_id: str):
    req = approval_queue.deny(approval_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Approval request not found")

    await event_manager.emit(
        req.conversation_id, "agent:denied", req.source_agent,
        target=req.target_agent,
        approval_id=req.id,
        message=f"Request for {req.data_type} has been denied",
    )
    return req.to_dict()


# ── Run ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.server:app",
        host="0.0.0.0",
        port=settings.app_port,
        reload=True,
    )
