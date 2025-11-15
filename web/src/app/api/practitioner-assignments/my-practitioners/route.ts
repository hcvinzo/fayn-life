/**
 * My Assigned Practitioners API Route
 * GET /api/practitioner-assignments/my-practitioners
 * Returns assigned practitioners for current assistant user
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { practitionerAssignmentRepository } from "@/lib/repositories/practitioner-assignment-repository";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/response";

/**
 * GET /api/practitioner-assignments/my-practitioners
 * Get assigned practitioners for current user (assistants only)
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

    // Get user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    if (!profile) {
      return errorResponse("Profile not found", "NOT_FOUND", 404);
    }

    // Only assistants should call this endpoint
    // But we'll allow it for all roles for flexibility
    // Non-assistants will just get an empty array

    if (profile.role === "assistant") {
      const practitioners =
        await practitionerAssignmentRepository.getAssignedPractitioners(
          user.id
        );
      return successResponse(practitioners);
    }

    // For non-assistants, return empty array
    return successResponse([]);
  } catch (error) {
    console.error(
      "Error in GET /api/practitioner-assignments/my-practitioners:",
      error
    );
    return handleApiError(error);
  }
}
