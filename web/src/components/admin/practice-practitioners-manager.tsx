"use client";

import { useState, useEffect, useMemo } from "react";
import { practitionerApi } from "@/lib/api/practitioner-api";
import type { PractitionerWithPractice } from "@/types/practitioner";
import { Users, Loader2, X, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface PracticePractitionersManagerProps {
  practiceId: string;
  onPractitionersChange?: (practitionerIds: string[]) => void;
}

/**
 * Component for managing practitioners assigned to a practice
 * Shows current assignments and allows adding/removing practitioners
 */
export function PracticePractitionersManager({
  practiceId,
  onPractitionersChange,
}: PracticePractitionersManagerProps) {
  const [loading, setLoading] = useState(true);
  const [assignedPractitioners, setAssignedPractitioners] = useState<PractitionerWithPractice[]>([]);
  const [allPractitioners, setAllPractitioners] = useState<PractitionerWithPractice[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPractitioners = async () => {
      try {
        setLoading(true);

        // Fetch assigned practitioners for this practice
        const assigned = await practitionerApi.getAll({ practice_id: practiceId });

        // Fetch all practitioners with practitioner or staff role
        const [practitioners, staff] = await Promise.all([
          practitionerApi.getAll({ role: 'practitioner' }),
          practitionerApi.getAll({ role: 'staff' }),
        ]);

        // Combine both lists
        const all = [...practitioners, ...staff];

        setAssignedPractitioners(assigned);
        setAllPractitioners(all);
      } catch (err) {
        console.error("Error fetching practitioners:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPractitioners();
  }, [practiceId]);

  // Get unassigned practitioners (practice_id is null)
  const unassignedPractitioners = useMemo(() => {
    return allPractitioners.filter(
      (p) => p.practice_id === null || p.practice_id === undefined
    );
  }, [allPractitioners]);

  // Filter unassigned practitioners by search term
  const filteredUnassignedPractitioners = useMemo(() => {
    if (!searchTerm.trim()) {
      return unassignedPractitioners;
    }

    const search = searchTerm.toLowerCase();
    return unassignedPractitioners.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(search) ||
        p.email.toLowerCase().includes(search)
    );
  }, [unassignedPractitioners, searchTerm]);

  const handleAddPractitioner = async (practitioner: PractitionerWithPractice) => {
    try {
      setSaving(true);

      // Update practitioner's practice_id
      await practitionerApi.update(practitioner.id, {
        practice_id: practiceId,
      });

      // Update local state
      const updatedPractitioner = { ...practitioner, practice_id: practiceId };
      setAssignedPractitioners([...assignedPractitioners, updatedPractitioner]);

      // Remove from all practitioners list (since they're now assigned)
      setAllPractitioners(allPractitioners.filter((p) => p.id !== practitioner.id));

      setShowAddDialog(false);
      setSearchTerm(""); // Clear search on add

      // Notify parent component
      if (onPractitionersChange) {
        onPractitionersChange([...assignedPractitioners, updatedPractitioner].map((p) => p.id));
      }
    } catch (err) {
      console.error("Error adding practitioner:", err);
      alert("Failed to add practitioner");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePractitioner = async (practitionerId: string) => {
    if (!confirm("Are you sure you want to remove this practitioner from the practice?")) {
      return;
    }

    try {
      setSaving(true);

      // Update practitioner's practice_id to null (unassign from practice)
      await practitionerApi.update(practitionerId, {
        practice_id: null,
      });

      // Update local state - remove from assigned list and add back to unassigned pool
      const removedPractitioner = assignedPractitioners.find((p) => p.id === practitionerId);
      setAssignedPractitioners(assignedPractitioners.filter((p) => p.id !== practitionerId));

      // Add back to all practitioners list with practice_id set to null
      if (removedPractitioner) {
        const unassignedPractitioner = { ...removedPractitioner, practice_id: null };
        setAllPractitioners([...allPractitioners, unassignedPractitioner]);
      }

      // Notify parent component
      if (onPractitionersChange) {
        onPractitionersChange(assignedPractitioners.filter((p) => p.id !== practitionerId).map((p) => p.id));
      }
    } catch (err) {
      console.error("Error removing practitioner:", err);
      alert("Failed to remove practitioner");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assigned Practitioners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assigned Practitioners ({assignedPractitioners.length})
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage practitioners assigned to this practice
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(!showAddDialog)}
            disabled={saving}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Practitioner
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Practitioner Dialog */}
        {showAddDialog && (
          <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Select a practitioner to add:
              </h4>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setSearchTerm("");
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box */}
            <div className="mb-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            {unassignedPractitioners.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All practitioners are already assigned to this practice.
              </p>
            ) : filteredUnassignedPractitioners.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No practitioners found matching "{searchTerm}"
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredUnassignedPractitioners.map((practitioner) => (
                  <button
                    key={practitioner.id}
                    onClick={() => handleAddPractitioner(practitioner)}
                    disabled={saving}
                    className="w-full flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {practitioner.full_name || "Unnamed"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {practitioner.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        practitioner.role === "practitioner"
                          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
                          : "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-400"
                      }`}
                    >
                      {practitioner.role.charAt(0).toUpperCase() + practitioner.role.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assigned Practitioners List */}
        {assignedPractitioners.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No practitioners assigned yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Click "Add Practitioner" to assign practitioners to this practice
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedPractitioners.map((practitioner) => (
              <div
                key={practitioner.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {practitioner.full_name || "Unnamed"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {practitioner.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      practitioner.role === "practitioner"
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
                        : "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-400"
                    }`}
                  >
                    {practitioner.role.charAt(0).toUpperCase() + practitioner.role.slice(1)}
                  </span>
                  <button
                    onClick={() => handleRemovePractitioner(practitioner.id)}
                    disabled={saving}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove practitioner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
