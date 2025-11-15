"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "./use-permissions";
import { practitionerAssignmentApi } from "@/lib/api/practitioner-assignment-api";
import { AssignedPractitioner } from "@/types/permission";

/**
 * Hook for assistants to get their assigned practitioners
 *
 * For non-assistants, returns empty array
 *
 * Usage:
 * ```tsx
 * const { practitioners, isLoading, error, refetch } = useAssignedPractitioners();
 * ```
 */
export function useAssignedPractitioners() {
  const { isAssistant, isLoading: isAuthLoading } = usePermissions();
  const [practitioners, setPractitioners] = useState<AssignedPractitioner[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPractitioners = async () => {
    // Only assistants need assigned practitioners
    if (!isAssistant) {
      setPractitioners([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data =
        await practitionerAssignmentApi.getMyAssignedPractitioners();
      setPractitioners(data);
    } catch (err) {
      console.error("Error fetching assigned practitioners:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch practitioners"
      );
      setPractitioners([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      fetchPractitioners();
    }
  }, [isAssistant, isAuthLoading]);

  return {
    practitioners,
    isLoading: isAuthLoading || isLoading,
    error,
    refetch: fetchPractitioners,
  };
}
