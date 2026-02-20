"use client";

import type { Approval } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "var(--status-pending)",
    label: "Pending",
  },
  approved: {
    icon: CheckCircle2,
    color: "var(--status-approved)",
    label: "Approved",
  },
  denied: {
    icon: XCircle,
    color: "var(--status-denied)",
    label: "Denied",
  },
  fulfilled: {
    icon: CheckCircle2,
    color: "var(--status-approved)",
    label: "Fulfilled",
  },
};

interface ApprovalItemProps {
  approval: Approval;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export function ApprovalItem({
  approval,
  onApprove,
  onDeny,
}: ApprovalItemProps) {
  const config = STATUS_CONFIG[approval.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 shrink-0" style={{ color: config.color }} />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {approval.data_type} request
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            From {approval.source_agent} &middot;{" "}
            {new Date(approval.created_at).toLocaleTimeString()}
          </p>
          {approval.sensitivity_reason && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {approval.sensitivity_reason}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="text-xs"
          style={{ borderColor: config.color, color: config.color }}
        >
          {config.label}
        </Badge>
        {approval.status === "pending" && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-[var(--status-denied)] text-[var(--status-denied)] hover:bg-[var(--status-denied)] hover:text-white"
              onClick={() => onDeny(approval.id)}
            >
              Deny
            </Button>
            <Button
              size="sm"
              className="text-xs bg-[var(--status-approved)] hover:bg-[var(--status-approved)]/90 text-white"
              onClick={() => onApprove(approval.id)}
            >
              Approve
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
