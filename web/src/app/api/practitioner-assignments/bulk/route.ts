/**
 * Bulk Practitioner Assignments API Route
 * POST /api/practitioner-assignments/bulk
 * Create multiple assignments at once
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { practitionerAssignmentRepository } from "@/lib/repositories/practitioner-assignment-repository";
import { serverAuthorizationService } from "@/lib/services/authorization-service";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/response";

/**
 * POST /api/practitioner-assignments/bulk
 * Create multiple assignments for an assistant
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Get authorization context
    const context = await serverAuthorizationService.getAuthorizationContext(
      user.id
    );
    if (!context) {
      return errorResponse("Authorization context not found", "FORBIDDEN", 403);
    }

    // Only admins can create bulk assignments
    if (!serverAuthorizationService.isAdmin(context)) {
      return errorResponse("Forbidden: Admin access required", "FORBIDDEN", 403);
    }

    const body = await request.json();
    const { assistantId, practitionerIds, practiceId } = body;

    if (!assistantId || !Array.isArray(practitionerIds) || !practiceId) {
      return errorResponse(
        "assistantId, practitionerIds (array), and practiceId are required",
        "BAD_REQUEST",
        400
      );
    }

    if (practitionerIds.length === 0) {
      return errorResponse("practitionerIds array cannot be empty", "BAD_REQUEST", 400);
    }

    // Create assignments for each practitioner
    const assignmentData = practitionerIds.map((practitionerId) => ({
      assistant_id: assistantId,
      practitioner_id: practitionerId,
      practice_id: practiceId,
      created_by: user.id,
    }));

    const assignments =
      await practitionerAssignmentRepository.createMany(assignmentData);

    return successResponse(assignments, 201);
  } catch (error) {
    console.error("Error in POST /api/practitioner-assignments/bulk:", error);
    return handleApiError(error);
  }
}
