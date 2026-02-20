"use client";

import { useState, useEffect } from "react";
import type { Approval } from "@/lib/types";
import { ApprovalItem } from "./ApprovalItem";
import { api } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApprovalQueueProps {
  filter: "all" | "pending" | "approved";
}

// Mock data for development before backend is available
const MOCK_APPROVALS: Approval[] = [
  {
    id: "1",
    source_agent: "Finance Manager",
    target_agent: "Accountant",
    data_type: "P&L Statement",
    sensitivity_reason: "Contains revenue and margin data",
    status: "pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    source_agent: "CEO",
    target_agent: "Accountant",
    data_type: "Expense Breakdown",
    sensitivity_reason: "Contains salary information",
    status: "approved",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: "3",
    source_agent: "Finance Manager",
    target_agent: "Accountant",
    data_type: "Invoice Records",
    sensitivity_reason: "",
    status: "denied",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    resolved_at: new Date(Date.now() - 6800000).toISOString(),
  },
];

export function ApprovalQueue({ filter }: ApprovalQueueProps) {
  const [approvals, setApprovals] = useState<Approval[]>(MOCK_APPROVALS);

  useEffect(() => {
    // Try fetching from backend; fall back to mock data
    api.getApprovals().then(setApprovals).catch(() => {});
  }, []);

  const filtered =
    filter === "all"
      ? approvals
      : approvals.filter((a) => a.status === filter);

  const handleApprove = async (id: string) => {
    try {
      await api.approveRequest(id);
    } catch {
      // Update locally if backend unavailable
    }
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "approved" as const } : a))
    );
  };

  const handleDeny = async (id: string) => {
    try {
      await api.denyRequest(id);
    } catch {
      // Update locally if backend unavailable
    }
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "denied" as const } : a))
    );
  };

  return (
    <ScrollArea className="w-[800px]">
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-tertiary)] py-8">
            No approvals to show.
          </p>
        ) : (
          filtered.map((approval) => (
            <ApprovalItem
              key={approval.id}
              approval={approval}
              onApprove={handleApprove}
              onDeny={handleDeny}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
