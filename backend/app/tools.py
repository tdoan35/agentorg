"""Strands tools available to agents."""
from __future__ import annotations

import json
import logging
from pathlib import Path

from strands.tools import tool

logger = logging.getLogger(__name__)

MOCK_DATA_DIR = Path(__file__).parent / "mock_data"


# ── Inter-agent communication ───────────────────────────────────────────
@tool
def request_from_agent(target_agent: str, data_type: str, ask: str) -> str:
    """Route a data request to another agent in the organization.

    Args:
        target_agent: The slug of the agent to request from (e.g. 'accountant').
        data_type: The type of data being requested (e.g. 'pnl', 'invoices').
        ask: A natural language description of what you need.

    Returns:
        The response from the target agent, or a pending-approval notice.
    """
    # This is intercepted by the orchestrator at runtime.
    return json.dumps({
        "status": "error",
        "message": "Orchestrator not connected — request_from_agent requires the orchestrator runtime.",
    })


@tool
def summarize_report(report_json: str, focus: str) -> str:
    """Summarize a financial report with a specific focus area.

    Args:
        report_json: JSON string of the report data.
        focus: What aspect to focus the summary on (e.g. 'revenue trends', 'cost reduction').

    Returns:
        A concise summary of the report focused on the requested area.
    """
    return json.dumps({
        "status": "success",
        "message": f"Please summarize the following report focusing on {focus}:\n{report_json}",
    })


# ── Data retrieval ──────────────────────────────────────────────────────
@tool
def pull_pnl(quarter: str, year: str) -> str:
    """Pull the Profit & Loss statement for a given quarter and year.

    Args:
        quarter: The quarter (e.g. 'Q4').
        year: The year (e.g. '2024').

    Returns:
        JSON string of the P&L data.
    """
    try:
        data = json.loads((MOCK_DATA_DIR / "pnl.json").read_text())
        data["_query"] = {"quarter": quarter, "year": year}
        return json.dumps(data)
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@tool
def pull_invoices(status_filter: str, category: str) -> str:
    """Pull invoices filtered by status and/or category.

    Args:
        status_filter: Filter by status: 'all', 'paid', 'pending', or 'overdue'.
        category: Filter by category or 'all' for all categories.

    Returns:
        JSON string of the filtered invoices.
    """
    try:
        data = json.loads((MOCK_DATA_DIR / "invoices.json").read_text())
        invoices = data["invoices"]

        if status_filter and status_filter != "all":
            invoices = [i for i in invoices if i["status"] == status_filter]
        if category and category != "all":
            invoices = [i for i in invoices if i["category"] == category]

        return json.dumps({
            "invoices": invoices,
            "count": len(invoices),
            "filter": {"status": status_filter, "category": category},
        })
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@tool
def check_approval_required_tool(data_type: str) -> str:
    """Check whether accessing a data type requires approval.

    Args:
        data_type: The data resource identifier (e.g. 'pnl', 'invoices').

    Returns:
        JSON indicating whether approval is required and the reason.
    """
    try:
        from app.graph.queries import check_approval_required

        policy = check_approval_required(data_type)
        if policy:
            return json.dumps({
                "requires_approval": True,
                "level": policy["level"],
                "reason": policy["reason"],
            })
        return json.dumps({"requires_approval": False})
    except Exception as e:
        logger.warning("Neo4j unavailable for approval check: %s", e)
        needs = data_type in ("pnl", "budget")
        return json.dumps({
            "requires_approval": needs,
            "reason": f"{data_type} is sensitive" if needs else "",
        })


@tool
def check_approval_status(approval_id: str) -> str:
    """Check the status of a previously created approval request.

    Args:
        approval_id: The ID of the approval request to check.

    Returns:
        JSON with the approval status and any associated data.
    """
    try:
        from app.orchestrator.approval import approval_queue

        req = approval_queue.get(approval_id)
        if req is None:
            return json.dumps({"status": "not_found", "approval_id": approval_id})
        return json.dumps(req.to_dict())
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


# ── Tool registry ──────────────────────────────────────────────────────
TOOLS: dict[str, object] = {
    "request_from_agent": request_from_agent,
    "summarize_report": summarize_report,
    "pull_pnl": pull_pnl,
    "pull_invoices": pull_invoices,
    "check_approval_required": check_approval_required_tool,
    "check_approval_status": check_approval_status,
}
