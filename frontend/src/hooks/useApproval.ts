"use client";

import { useState, useEffect, useCallback } from "react";
import type { Approval } from "@/lib/types";
import { api } from "@/lib/api";

export function useApproval(persona: string) {
  const [pending, setPending] = useState<Approval[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await api.getApprovals("pending");
        setPending(data);
      } catch {
        // Backend not available yet — ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [persona]);

  const approve = useCallback(async (id: string) => {
    await api.approveRequest(id);
    setPending((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const deny = useCallback(async (id: string) => {
    await api.denyRequest(id);
    setPending((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { pending, approve, deny };
}
