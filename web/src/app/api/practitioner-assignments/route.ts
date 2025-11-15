/**
 * Practitioner Assignments API Routes
 * Handles GET (list) and POST (create) for practitioner assignments
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { practitionerAssignmentRepository } from "@/lib/repositories/practitioner-assignment-repository";
import { serverAuthorizationService } from "@/lib/services/authorization-service";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/response";

/**
 * GET /api/practitioner-assignments
 * Get assignments based on query parameters
 * Admin only
 */
export async function GET(request: NextRequest) {
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

    // Only admins can list assignments
    if (!serverAuthorizationService.isAdmin(context)) {
      return errorResponse("Forbidden: Admin access required", "FORBIDDEN", 403);
    }

    const searchParams = request.nextUrl.searchParams;
    const practiceId = searchParams.get("practiceId");

    if (!practiceId) {
      return errorResponse("practiceId query parameter is required", "BAD_REQUEST", 400);
    }

    const assignments =
      await practitionerAssignmentRepository.findByPractice(practiceId);

    return successResponse(assignments);
  } catch (error) {
    console.error("Error in GET /api/practitioner-assignments:", error);
    return handleApiError(error);
  }
}

/**
 * POST /api/practitioner-assignments
 * Create a new practitioner assignment
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

    // Only admins can create assignments
    if (!serverAuthorizationService.isAdmin(context)) {
      return errorResponse("Forbidden: Admin access required", "FORBIDDEN", 403);
    }

    const body = await request.json();
    const { assistantId, practitionerId, practiceId } = body;

    if (!assistantId || !practitionerId || !practiceId) {
      return errorResponse(
        "assistantId, practitionerId, and practiceId are required",
        "BAD_REQUEST",
        400
      );
    }

    // Create the assignment
    const assignment = await practitionerAssignmentRepository.create({
      assistant_id: assistantId,
      practitioner_id: practitionerId,
      practice_id: practiceId,
      created_by: user.id,
    });

    return successResponse(assignment, 201);
  } catch (error) {
    console.error("Error in POST /api/practitioner-assignments:", error);
    return handleApiError(error);
  }
}
