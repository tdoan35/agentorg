from __future__ import annotations

from app.graph.client import run_query


def check_permission(requester_slug: str, data_id: str) -> bool:
    """Return True if the requester agent can access the data resource."""
    rows = run_query(
        """
        MATCH (r:Person {slug: $requester})-[:CAN_REQUEST]->(d:DataResource {id: $data_id})
        RETURN d.id AS data_id
        """,
        requester=requester_slug,
        data_id=data_id,
    )
    return len(rows) > 0


def find_data_owner(data_id: str) -> str | None:
    """Return the slug of the agent that owns the data resource."""
    rows = run_query(
        """
        MATCH (owner:Person)-[:OWNS_DATA]->(d:DataResource {id: $data_id})
        RETURN owner.slug AS slug
        """,
        data_id=data_id,
    )
    return rows[0]["slug"] if rows else None


def check_approval_required(data_id: str) -> dict | None:
    """Return the approval policy if the data resource requires approval, else None."""
    rows = run_query(
        """
        MATCH (d:DataResource {id: $data_id})-[:REQUIRES_APPROVAL]->(p:ApprovalPolicy)
        RETURN p.level AS level, p.reason AS reason
        """,
        data_id=data_id,
    )
    return rows[0] if rows else None


def full_routing_query(requester_slug: str, data_id: str) -> dict:
    """Combined query: permission check, owner lookup, approval requirement."""
    rows = run_query(
        """
        OPTIONAL MATCH (r:Person {slug: $requester})-[:CAN_REQUEST]->(d:DataResource {id: $data_id})
        WITH d, r
        OPTIONAL MATCH (owner:Person)-[:OWNS_DATA]->(d)
        OPTIONAL MATCH (d)-[:REQUIRES_APPROVAL]->(p:ApprovalPolicy)
        RETURN
            d IS NOT NULL AS has_permission,
            owner.slug AS owner_slug,
            p.level AS approval_level,
            p.reason AS approval_reason
        """,
        requester=requester_slug,
        data_id=data_id,
    )
    if not rows:
        return {"has_permission": False, "owner_slug": None, "approval_level": None, "approval_reason": None}
    return rows[0]
