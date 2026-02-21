"use client";

import { useState } from "react";
import { ApprovalQueue } from "@/components/approval/ApprovalQueue";
import { ApprovalFilters } from "@/components/approval/ApprovalFilters";

export default function TasksPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  return (
    <div className="flex-1 flex flex-col items-center p-8 gap-6 h-full overflow-y-auto">
      <div className="w-[800px] flex justify-between items-center">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Approval Queue
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm">
            Review and approve data access requests from other agents.
          </p>
        </div>
        <ApprovalFilters active={filter} onChange={setFilter} />
      </div>
      <ApprovalQueue filter={filter} />
    </div>
  );
}
