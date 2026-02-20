"""In-memory approval queue for inter-agent data requests."""
from __future__ import annotations

import uuid
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

logger = logging.getLogger(__name__)


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    FULFILLED = "fulfilled"


@dataclass
class ApprovalRequest:
    id: str
    source_agent: str
    target_agent: str
    data_type: str
    sensitivity_reason: str
    conversation_id: str
    ask: str = ""
    status: ApprovalStatus = ApprovalStatus.PENDING
    created_at: str = ""
    resolved_at: Optional[str] = None
    stored_data: Any = None  # Data cached when target agent responds, released on approval

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "source_agent": self.source_agent,
            "target_agent": self.target_agent,
            "data_type": self.data_type,
            "sensitivity_reason": self.sensitivity_reason,
            "status": self.status.value,
            "created_at": self.created_at,
            "resolved_at": self.resolved_at,
        }


class ApprovalQueue:
    """In-memory store for approval requests."""

    def __init__(self) -> None:
        self._requests: dict[str, ApprovalRequest] = {}

    def create(
        self,
        source_agent: str,
        target_agent: str,
        data_type: str,
        sensitivity_reason: str,
        conversation_id: str,
        ask: str = "",
    ) -> ApprovalRequest:
        req = ApprovalRequest(
            id=str(uuid.uuid4()),
            source_agent=source_agent,
            target_agent=target_agent,
            data_type=data_type,
            sensitivity_reason=sensitivity_reason,
            conversation_id=conversation_id,
            ask=ask,
        )
        self._requests[req.id] = req
        logger.info("Created approval request %s: %s → %s (%s)", req.id, source_agent, target_agent, data_type)
        return req

    def get(self, approval_id: str) -> Optional[ApprovalRequest]:
        return self._requests.get(approval_id)

    def approve(self, approval_id: str) -> Optional[ApprovalRequest]:
        req = self._requests.get(approval_id)
        if req and req.status == ApprovalStatus.PENDING:
            req.status = ApprovalStatus.APPROVED
            req.resolved_at = datetime.now(timezone.utc).isoformat()
            logger.info("Approved request %s", approval_id)
        return req

    def deny(self, approval_id: str) -> Optional[ApprovalRequest]:
        req = self._requests.get(approval_id)
        if req and req.status == ApprovalStatus.PENDING:
            req.status = ApprovalStatus.DENIED
            req.resolved_at = datetime.now(timezone.utc).isoformat()
            logger.info("Denied request %s", approval_id)
        return req

    def fulfill(self, approval_id: str) -> Optional[ApprovalRequest]:
        req = self._requests.get(approval_id)
        if req and req.status == ApprovalStatus.APPROVED:
            req.status = ApprovalStatus.FULFILLED
            logger.info("Fulfilled request %s", approval_id)
        return req

    def list_by_status(self, status: Optional[str] = None) -> list[dict]:
        results = self._requests.values()
        if status:
            results = [r for r in results if r.status.value == status]
        return [r.to_dict() for r in results]


approval_queue = ApprovalQueue()
