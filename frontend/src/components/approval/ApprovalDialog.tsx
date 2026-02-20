"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Approval } from "@/lib/types";

interface ApprovalDialogProps {
  approval?: Approval | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export function ApprovalDialog({
  approval,
  open,
  onOpenChange,
  onApprove,
  onDeny,
}: ApprovalDialogProps) {
  if (!approval) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-subtle)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">
            Approval Request
          </DialogTitle>
          <DialogDescription className="text-[var(--text-tertiary)]">
            {approval.source_agent} is requesting access to{" "}
            <strong className="text-[var(--text-secondary)]">
              {approval.data_type}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-[var(--bg-input)] p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">From</span>
              <span className="text-[var(--text-secondary)]">
                {approval.source_agent}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Data Type</span>
              <span className="text-[var(--text-secondary)]">
                {approval.data_type}
              </span>
            </div>
            {approval.sensitivity_reason && (
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Reason</span>
                <span className="text-[var(--status-pending)]">
                  {approval.sensitivity_reason}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="border-[var(--status-denied)] text-[var(--status-denied)] hover:bg-[var(--status-denied)] hover:text-white"
            onClick={() => {
              onDeny(approval.id);
              onOpenChange(false);
            }}
          >
            Deny
          </Button>
          <Button
            className="bg-[var(--status-approved)] hover:bg-[var(--status-approved)]/90 text-white"
            onClick={() => {
              onApprove(approval.id);
              onOpenChange(false);
            }}
          >
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
