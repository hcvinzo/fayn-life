/**
 * Practitioner Assignment API Client
 * Frontend HTTP client for managing practitioner-assistant assignments
 */

import { apiClient } from "./client";
import {
  PractitionerAssignment,
  AssignedPractitioner,
} from "@/types/permission";

export const practitionerAssignmentApi = {
  /**
   * Get assigned practitioners for current user (assistants only)
   */
  async getMyAssignedPractitioners(): Promise<AssignedPractitioner[]> {
    return apiClient.get("/practitioner-assignments/my-practitioners");
  },

  /**
   * Get all assignments for an assistant (admin only)
   */
  async getAssignmentsByAssistant(
    assistantId: string
  ): Promise<PractitionerAssignment[]> {
    return apiClient.get(`/practitioner-assignments/assistant/${assistantId}`);
  },

  /**
   * Get all assignments for a practitioner (admin only)
   */
  async getAssignmentsByPractitioner(
    practitionerId: string
  ): Promise<PractitionerAssignment[]> {
    return apiClient.get(
      `/practitioner-assignments/practitioner/${practitionerId}`
    );
  },

  /**
   * Get all assignments for a practice (admin only)
   */
  async getAssignmentsByPractice(
    practiceId: string
  ): Promise<PractitionerAssignment[]> {
    return apiClient.get(`/practitioner-assignments/practice/${practiceId}`);
  },

  /**
   * Create a new assignment (admin only)
   */
  async createAssignment(data: {
    assistantId: string;
    practitionerId: string;
    practiceId: string;
  }): Promise<PractitionerAssignment> {
    return apiClient.post("/practitioner-assignments", data);
  },

  /**
   * Create multiple assignments at once (admin only)
   */
  async createBulkAssignments(data: {
    assistantId: string;
    practitionerIds: string[];
    practiceId: string;
  }): Promise<PractitionerAssignment[]> {
    return apiClient.post("/practitioner-assignments/bulk", data);
  },

  /**
   * Delete an assignment (admin only)
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    return apiClient.delete(`/practitioner-assignments/${assignmentId}`);
  },

  /**
   * Delete assignment by assistant-practitioner pair (admin only)
   */
  async deleteAssignmentByPair(
    assistantId: string,
    practitionerId: string
  ): Promise<void> {
    return apiClient.delete(
      `/practitioner-assignments/assistant/${assistantId}/practitioner/${practitionerId}`
    );
  },

  /**
   * Replace all assignments for an assistant (admin only)
   */
  async replaceAssignments(data: {
    assistantId: string;
    practitionerIds: string[];
    practiceId: string;
  }): Promise<PractitionerAssignment[]> {
    return apiClient.put(
      `/practitioner-assignments/assistant/${data.assistantId}`,
      {
        practitionerIds: data.practitionerIds,
        practiceId: data.practiceId,
      }
    );
  },
};
