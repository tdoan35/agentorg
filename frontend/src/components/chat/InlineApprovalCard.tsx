"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, ShieldAlert, ArrowRight } from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "var(--status-pending)",
    label: "Pending",
  },
  executing: {
    icon: Clock,
    color: "var(--status-pending)",
    label: "Awaiting Review",
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
} as const;

interface InlineApprovalCardProps {
  approvalId: string;
  sourceAgent: string;
  targetAgent: string;
  dataType: string;
  sensitivityReason: string;
  status: string;
  onApprove?: () => void;
  onDeny?: () => void;
}

export function InlineApprovalCard({
  approvalId,
  sourceAgent,
  targetAgent,
  dataType,
  sensitivityReason,
  status,
  onApprove,
  onDeny,
}: InlineApprovalCardProps) {
  const [isActing, setIsActing] = useState(false);

  const configKey = (status in STATUS_CONFIG ? status : "pending") as keyof typeof STATUS_CONFIG;
  const config = STATUS_CONFIG[configKey];
  const Icon = config.icon;

  const canAct = status === "executing" && onApprove && onDeny;

  const handleApprove = async () => {
    setIsActing(true);
    onApprove?.();
  };

  const handleDeny = async () => {
    setIsActing(true);
    onDeny?.();
  };

  return (
    <div className="my-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
        <ShieldAlert className="w-4 h-4 text-[var(--status-pending)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          Approval Required
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Data type */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {dataType} request
          </span>
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: config.color, color: config.color }}
          >
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        {/* Routing info */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span className="px-2 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-secondary)]">
            {sourceAgent}
          </span>
          <ArrowRight className="w-3 h-3" />
          <span className="px-2 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-secondary)]">
            {targetAgent}
          </span>
        </div>

        {/* Sensitivity reason */}
        {sensitivityReason && (
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {sensitivityReason}
          </p>
        )}

        {/* Actions */}
        {canAct && !isActing && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-[var(--status-denied)] text-[var(--status-denied)] hover:bg-[var(--status-denied)] hover:text-white"
              onClick={handleDeny}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Deny
            </Button>
            <Button
              size="sm"
              className="text-xs bg-[var(--status-approved)] hover:bg-[var(--status-approved)]/90 text-white"
              onClick={handleApprove}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Approve
            </Button>
          </div>
        )}

        {isActing && (
          <p className="text-xs text-[var(--text-tertiary)] animate-pulse">
            Processing...
          </p>
        )}
      </div>
    </div>
  );
}
