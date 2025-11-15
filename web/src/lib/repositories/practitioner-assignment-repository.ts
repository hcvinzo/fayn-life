/**
 * Practitioner Assignment Repository
 * Handles database operations for practitioner-assistant assignments
 */

import { createClient } from "@/lib/supabase/server";
import {
  PractitionerAssignment,
  AssignedPractitioner,
} from "@/types/permission";
import { Database } from "@/types/database";

type PractitionerAssignmentInsert =
  Database["public"]["Tables"]["practitioner_assignments"]["Insert"];
type PractitionerAssignmentUpdate =
  Database["public"]["Tables"]["practitioner_assignments"]["Update"];

export class PractitionerAssignmentRepository {
  /**
   * Get all assignments for an assistant
   */
  async findByAssistant(
    assistantId: string
  ): Promise<PractitionerAssignment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("practitioner_assignments")
      .select("*")
      .eq("assistant_id", assistantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all assigned practitioners for an assistant (with profile data)
   */
  async getAssignedPractitioners(
    assistantId: string
  ): Promise<AssignedPractitioner[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("practitioner_assignments")
      .select(
        `
        practitioner:practitioner_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq("assistant_id", assistantId);

    if (error) throw error;

    // Transform the nested data structure
    return (
      data?.map((item: any) => ({
        id: item.practitioner.id,
        full_name: item.practitioner.full_name,
        email: item.practitioner.email,
      })) || []
    );
  }

  /**
   * Get all assistants assigned to a practitioner
   */
  async findByPractitioner(
    practitionerId: string
  ): Promise<PractitionerAssignment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("practitioner_assignments")
      .select("*")
      .eq("practitioner_id", practitionerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all assignments for a practice
   */
  async findByPractice(practiceId: string): Promise<PractitionerAssignment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("practitioner_assignments")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new assignment
   */
  async create(
    assignment: PractitionerAssignmentInsert
  ): Promise<PractitionerAssignment> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("practitioner_assignments")
      .insert(assignment as any)
      .select()
      .single();

    if (error) throw error;
    return data as PractitionerAssignment;
  }

  /**
   * Create multiple assignments at once
   */
  async createMany(
    assignments: PractitionerAssignmentInsert[]
  ): Promise<PractitionerAssignment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("practitioner_assignments")
      .insert(assignments as any)
      .select();

    if (error) throw error;
    return (data || []) as PractitionerAssignment[];
  }

  /**
   * Delete an assignment by ID
   */
  async delete(assignmentId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("practitioner_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) throw error;
  }

  /**
   * Delete all assignments for an assistant-practitioner pair
   */
  async deleteByPair(
    assistantId: string,
    practitionerId: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("practitioner_assignments")
      .delete()
      .eq("assistant_id", assistantId)
      .eq("practitioner_id", practitionerId);

    if (error) throw error;
  }

  /**
   * Delete all assignments for an assistant
   */
  async deleteByAssistant(assistantId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("practitioner_assignments")
      .delete()
      .eq("assistant_id", assistantId);

    if (error) throw error;
  }

  /**
   * Check if an assistant is assigned to a practitioner
   */
  async isAssigned(
    assistantId: string,
    practitionerId: string
  ): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("practitioner_assignments")
      .select("id")
      .eq("assistant_id", assistantId)
      .eq("practitioner_id", practitionerId)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  /**
   * Get practitioner IDs assigned to an assistant
   */
  async getAssignedPractitionerIds(assistantId: string): Promise<string[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("practitioner_assignments")
      .select("practitioner_id")
      .eq("assistant_id", assistantId);

    if (error) throw error;
    return (data as any)?.map((item: any) => item.practitioner_id) || [];
  }
}

// Export singleton instance for server-side use
export const practitionerAssignmentRepository =
  new PractitionerAssignmentRepository();
