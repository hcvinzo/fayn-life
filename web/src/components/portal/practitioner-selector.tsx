"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAssignedPractitioners } from "@/hooks/use-assigned-practitioners";
import { usePermissions } from "@/hooks/use-permissions";
import { Loader2 } from "lucide-react";

interface PractitionerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Practitioner Selector Component
 *
 * For assistants: Shows only assigned practitioners
 * For practitioners/admins: Shows all practitioners in practice (TODO: implement)
 *
 * Usage:
 * ```tsx
 * <PractitionerSelector
 *   value={practitionerId}
 *   onChange={setPractitionerId}
 *   error={errors.practitionerId}
 * />
 * ```
 */
export function PractitionerSelector({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
}: PractitionerSelectorProps) {
  const { isAssistant, isLoading: isAuthLoading } = usePermissions();
  const {
    practitioners,
    isLoading: isPractitionersLoading,
    error: practitionersError,
  } = useAssignedPractitioners();

  const isLoading = isAuthLoading || isPractitionersLoading;

  // For assistants, use assigned practitioners
  // For others, we'll need to fetch all practitioners in practice
  // For now, assistants only - will extend later
  const availablePractitioners = isAssistant ? practitioners : [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>
          Practitioner {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex items-center justify-center h-10 border rounded-md bg-muted">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (practitionersError) {
    return (
      <div className="space-y-2">
        <Label>
          Practitioner {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="p-3 text-sm border rounded-md border-destructive bg-destructive/10 text-destructive">
          Error loading practitioners: {practitionersError}
        </div>
      </div>
    );
  }

  if (isAssistant && availablePractitioners.length === 0) {
    return (
      <div className="space-y-2">
        <Label>
          Practitioner {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="p-3 text-sm border rounded-md border-muted bg-muted/50 text-muted-foreground">
          No practitioners assigned to you. Please contact an administrator.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="practitioner">
        Practitioner {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id="practitioner"
          className={error ? "border-destructive" : ""}
        >
          <SelectValue placeholder="Select a practitioner" />
        </SelectTrigger>
        <SelectContent>
          {availablePractitioners.map((practitioner) => (
            <SelectItem key={practitioner.id} value={practitioner.id}>
              {practitioner.full_name || practitioner.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {isAssistant && (
        <p className="text-xs text-muted-foreground">
          You can only create appointments for assigned practitioners
        </p>
      )}
    </div>
  );
}
