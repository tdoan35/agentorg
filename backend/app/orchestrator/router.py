"""Orchestrator — routes messages between agents with Neo4j permissions and approval flow."""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Any

from app.agent_factory import AgentFactory
from app.agents import AGENT_SPECS
from app.models import ChatResponse
from app.orchestrator.approval import ApprovalStatus, approval_queue
from app.orchestrator.events import event_manager
from app.tools import TOOLS

logger = logging.getLogger(__name__)


class Orchestrator:
    """Main entry point for chat requests — manages agent lifecycle and routing."""

    def __init__(self) -> None:
        AgentFactory.register_tools(TOOLS)

    # ── Public API ──────────────────────────────────────────────────────

    async def handle_chat(
        self,
        message: str,
        persona: str,
        conversation_id: str | None = None,
    ) -> ChatResponse:
        conversation_id = conversation_id or str(uuid.uuid4())
        spec = AGENT_SPECS.get(persona)
        if spec is None:
            return ChatResponse(
                response=f"Unknown persona: {persona}",
                conversation_id=conversation_id,
                agent="system",
            )

        trace_id = str(uuid.uuid4())

        await event_manager.emit(
            conversation_id, "agent:thinking", spec.slug, message=f"{spec.name} is thinking..."
        )

        # Patch request_from_agent so it calls back to the orchestrator
        patched_tools = dict(TOOLS)
        orchestrator_ref = self

        from strands import tool as strands_tool

        @strands_tool
        def request_from_agent(target_agent: str, data_type: str, ask: str) -> str:
            """Route a data request to another agent in the organization.

            Args:
                target_agent: The slug of the agent to request from (e.g. 'accountant').
                data_type: The type of data being requested (e.g. 'pnl', 'invoices').
                ask: A natural language description of what you need.

            Returns:
                The response from the target agent, or a pending-approval notice.
            """
            return orchestrator_ref.route_request_sync(
                source=spec.slug,
                target=target_agent,
                data_type=data_type,
                ask=ask,
                conversation_id=conversation_id,
            )

        patched_tools["request_from_agent"] = request_from_agent
        AgentFactory.register_tools(patched_tools)

        try:
            response_text = await asyncio.to_thread(
                self._run_agent_sync, spec, message, conversation_id
            )
        except Exception as e:
            logger.exception("Agent %s failed", spec.slug)
            await event_manager.emit(
                conversation_id, "agent:error", spec.slug, message=str(e)
            )
            response_text = f"I encountered an error: {e}"

        await event_manager.emit(
            conversation_id, "agent:responding", spec.slug, message="Response ready"
        )

        return ChatResponse(
            response=response_text,
            conversation_id=conversation_id,
            agent=spec.slug,
            trace_id=trace_id,
        )

    def route_request_sync(
        self,
        source: str,
        target: str,
        data_type: str,
        ask: str,
        conversation_id: str,
    ) -> str:
        """Called by request_from_agent tool — runs in agent's sync thread."""

        # 1. Check Neo4j permissions
        event_manager.emit_sync(
            conversation_id, "agent:permission_check", source,
            target=target, message=f"Checking if {source} can access {data_type}",
        )

        has_permission = True
        approval_policy = None
        owner_slug = target

        try:
            from app.graph.queries import full_routing_query
            routing = full_routing_query(source, data_type)
            has_permission = routing["has_permission"]
            owner_slug = routing["owner_slug"] or target
            if routing["approval_level"]:
                approval_policy = {
                    "level": routing["approval_level"],
                    "reason": routing["approval_reason"],
                }
        except Exception as e:
            logger.warning("Neo4j unavailable, falling back to permissive mode: %s", e)

        if not has_permission:
            event_manager.emit_sync(
                conversation_id, "agent:denied", source,
                message=f"{source} does not have permission to access {data_type}",
            )
            return json.dumps({
                "status": "denied",
                "message": f"Permission denied: {source} cannot access {data_type}",
            })

        # 2. Route to target agent
        event_manager.emit_sync(
            conversation_id, "agent:routing", source,
            target=target, message=f"Routing request to {target} for {data_type}",
        )

        target_spec = AGENT_SPECS.get(owner_slug or target)
        if target_spec is None:
            return json.dumps({"status": "error", "message": f"Unknown agent: {target}"})

        # Run target agent
        try:
            agent = AgentFactory.create(target_spec)
            result = agent(f"Please provide the {data_type} data. Specific request: {ask}")
            target_response = str(result)
        except Exception as e:
            logger.exception("Target agent %s failed", target)
            return json.dumps({"status": "error", "message": str(e)})

        # 3. Check if approval is required
        if approval_policy:
            event_manager.emit_sync(
                conversation_id, "agent:awaiting_approval", source,
                target=target,
                message=f"Approval required: {approval_policy['reason']}",
            )

            req = approval_queue.create(
                source_agent=source,
                target_agent=owner_slug or target,
                data_type=data_type,
                sensitivity_reason=approval_policy["reason"],
                conversation_id=conversation_id,
                ask=ask,
            )
            # Store the data so it can be released after approval
            req.stored_data = target_response

            return json.dumps({
                "status": "pending_approval",
                "approval_id": req.id,
                "message": f"This data requires approval. Reason: {approval_policy['reason']}. "
                           f"Approval ID: {req.id}. The request is pending review.",
            })

        # 4. No approval needed — return data directly
        event_manager.emit_sync(
            conversation_id, "agent:fulfilled", source,
            target=target, message=f"Data delivered from {target}",
        )

        return json.dumps({
            "status": "success",
            "data": target_response,
        })

    def fulfill_approved_request(self, approval_id: str) -> dict[str, Any]:
        """Release stored data for an approved request."""
        req = approval_queue.get(approval_id)
        if req is None:
            return {"status": "not_found"}
        if req.status != ApprovalStatus.APPROVED:
            return {"status": req.status.value, "message": "Request is not in approved state"}

        approval_queue.fulfill(approval_id)
        return {
            "status": "fulfilled",
            "data": req.stored_data,
            "data_type": req.data_type,
        }

    # ── Internal ────────────────────────────────────────────────────────

    @staticmethod
    def _run_agent_sync(spec, message: str, conversation_id: str) -> str:
        agent = AgentFactory.create(spec)
        result = agent(message)
        return str(result)


orchestrator = Orchestrator()
