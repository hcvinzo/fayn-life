/**
 * Assistant Practitioner Assignments API Route
 * GET /api/practitioner-assignments/assistant/[assistantId]
 * Returns all assignments for a specific assistant
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { practitionerAssignmentRepository } from "@/lib/repositories/practitioner-assignment-repository";
import { serverAuthorizationService } from "@/lib/services/authorization-service";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/response";

/**
 * GET /api/practitioner-assignments/assistant/[assistantId]
 * Get all assignments for a specific assistant
 * Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
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

    // Only admins can view assignments
    if (!serverAuthorizationService.isAdmin(context)) {
      return errorResponse("Forbidden: Admin access required", "FORBIDDEN", 403);
    }

    const { assistantId } = await params;

    // Fetch assignments for this assistant
    const assignments =
      await practitionerAssignmentRepository.findByAssistant(assistantId);

    return successResponse(assignments);
  } catch (error) {
    console.error("Error in GET /api/practitioner-assignments/assistant/[assistantId]:", error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/practitioner-assignments/assistant/[assistantId]
 * Replace all assignments for an assistant
 * Admin only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
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

    // Only admins can update assignments
    if (!serverAuthorizationService.isAdmin(context)) {
      return errorResponse("Forbidden: Admin access required", "FORBIDDEN", 403);
    }

    const { assistantId } = await params;
    const body = await request.json();
    const { practitionerIds, practiceId } = body;

    if (!practitionerIds || !Array.isArray(practitionerIds) || !practiceId) {
      return errorResponse(
        "practitionerIds (array) and practiceId are required",
        "BAD_REQUEST",
        400
      );
    }

    // Replace all assignments for this assistant
    const assignments = await practitionerAssignmentRepository.replaceAssignments(
      assistantId,
      practitionerIds,
      practiceId,
      user.id
    );

    return successResponse(assignments);
  } catch (error) {
    console.error("Error in PUT /api/practitioner-assignments/assistant/[assistantId]:", error);
    return handleApiError(error);
  }
}
