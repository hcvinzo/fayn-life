/**
 * Single Practitioner Assignment API Routes
 * DELETE /api/practitioner-assignments/[id]
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { practitionerAssignmentRepository } from "@/lib/repositories/practitioner-assignment-repository";
import { serverAuthorizationService } from "@/lib/services/authorization-service";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/response";

/**
 * DELETE /api/practitioner-assignments/[id]
 * Delete a practitioner assignment
 * Admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Only admins can delete assignments
    if (!serverAuthorizationService.isAdmin(context)) {
      return errorResponse("Forbidden: Admin access required", "FORBIDDEN", 403);
    }

    const { id } = await params;

    if (!id) {
      return errorResponse("Assignment ID is required", "BAD_REQUEST", 400);
    }

    await practitionerAssignmentRepository.delete(id);

    return successResponse({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/practitioner-assignments/[id]:", error);
    return handleApiError(error);
  }
}
