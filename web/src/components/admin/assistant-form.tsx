"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  createPractitionerSchema,
  updatePractitionerSchema,
  type CreatePractitionerInput,
  type UpdatePractitionerInput,
} from "@/lib/validators/practitioner-schema";
import { practiceApi, type Practice } from "@/lib/api/practice-api";
import { practitionerApi } from "@/lib/api/practitioner-api";
import type { PractitionerWithPractice } from "@/types/practitioner";
import { Checkbox } from "../ui/checkbox";

type AssistantFormData = CreatePractitionerInput | UpdatePractitionerInput;

interface AssistantFormProps {
  defaultValues?: Partial<AssistantFormData>;
  onSubmit: (
    data: AssistantFormData,
    assignedPractitionerIds: string[]
  ) => Promise<void>;
  submitLabel?: string;
  isEditMode?: boolean;
  currentAssignments?: string[]; // IDs of currently assigned practitioners
}

/**
 * Reusable Assistant Form Component
 * Used for both creating and editing assistants with practitioner assignments
 */
export function AssistantForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Assistant",
  isEditMode = false,
  currentAssignments = [],
}: AssistantFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [practitioners, setPractitioners] = useState<PractitionerWithPractice[]>([]);
  const [loadingPractices, setLoadingPractices] = useState(true);
  const [loadingPractitioners, setLoadingPractitioners] = useState(false);
  const [selectedPractice, setSelectedPractice] = useState<string | null>(
    defaultValues?.practice_id || null
  );
  const [assignedPractitionerIds, setAssignedPractitionerIds] = useState<
    string[]
  >(currentAssignments);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<AssistantFormData>({
    resolver: zodResolver(
      isEditMode ? updatePractitionerSchema : createPractitionerSchema
    ),
    defaultValues: {
      status: "active",
      role: "assistant", // Always assistant
      ...defaultValues,
    },
  });

  // Watch practice_id to load practitioners when practice changes
  const watchedPracticeId = watch("practice_id");

  // Fetch practices for dropdown
  useEffect(() => {
    const fetchPractices = async () => {
      try {
        setLoadingPractices(true);
        const data = await practiceApi.getAll();
        setPractices(data);
      } catch (error) {
        console.error("Error fetching practices:", error);
      } finally {
        setLoadingPractices(false);
      }
    };

    fetchPractices();
  }, []);

  // Fetch practitioners for selected practice
  useEffect(() => {
    const fetchPractitioners = async () => {
      if (!watchedPracticeId) {
        setPractitioners([]);
        return;
      }

      try {
        setLoadingPractitioners(true);
        // Fetch all practitioners for the selected practice
        const data = await practitionerApi.getAll({
          practice_id: watchedPracticeId,
          role: "practitioner", // Only actual practitioners, not assistants
        });
        setPractitioners(data);
      } catch (error) {
        console.error("Error fetching practitioners:", error);
        setPractitioners([]);
      } finally {
        setLoadingPractitioners(false);
      }
    };

    fetchPractitioners();
    setSelectedPractice(watchedPracticeId ?? null);
  }, [watchedPracticeId]);

  // Handle practitioner assignment toggle
  const togglePractitioner = (practitionerId: string) => {
    setAssignedPractitionerIds((prev) => {
      if (prev.includes(practitionerId)) {
        return prev.filter((id) => id !== practitionerId);
      } else {
        return [...prev, practitionerId];
      }
    });
  };

  const onFormSubmit = async (data: AssistantFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data, assignedPractitionerIds);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Account Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("full_name")}
                type="text"
                id="full_name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Jane Smith"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register("email")}
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="jane.smith@example.com"
                disabled={isEditMode}
              />
              {'email' in errors && errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
              {isEditMode && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Email cannot be changed after account creation
                </p>
              )}
            </div>

            {/* Practice */}
            <div>
              <label
                htmlFor="practice_id"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Practice <span className="text-red-500">*</span>
              </label>
              <Controller
                name="practice_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                    value={field.value ?? undefined}
                    disabled={loadingPractices || isEditMode}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select practice" />
                    </SelectTrigger>
                    <SelectContent>
                      {practices.map((practice) => (
                        <SelectItem key={practice.id} value={practice.id}>
                          {practice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.practice_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.practice_id.message}
                </p>
              )}
              {isEditMode && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Practice cannot be changed after account creation
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Status <span className="text-red-500">*</span>
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.status.message}
                </p>
              )}
            </div>

            {/* Password - Only for create mode */}
            {!isEditMode && (
              <>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("password")}
                    type="password"
                    id="password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                  />
                  {'password' in errors && errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("confirm_password")}
                    type="password"
                    id="confirm_password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                  />
                  {'confirm_password' in errors && errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Practitioner Assignments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Practitioner Assignments</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select which practitioners this assistant can manage appointments
            for
          </p>
        </CardHeader>
        <CardContent>
          {!selectedPractice && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Please select a practice first to see available practitioners
            </div>
          )}

          {selectedPractice && loadingPractitioners && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {selectedPractice &&
            !loadingPractitioners &&
            practitioners.length === 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                No practitioners found in this practice
              </div>
            )}

          {selectedPractice &&
            !loadingPractitioners &&
            practitioners.length > 0 && (
              <div className="space-y-3">
                {practitioners.map((practitioner) => (
                  <div
                    key={practitioner.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Checkbox
                      id={`practitioner-${practitioner.id}`}
                      checked={assignedPractitionerIds.includes(
                        practitioner.id
                      )}
                      onCheckedChange={() =>
                        togglePractitioner(practitioner.id)
                      }
                    />
                    <label
                      htmlFor={`practitioner-${practitioner.id}`}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {practitioner.full_name || "Unnamed"}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {practitioner.email}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}

          {assignedPractitionerIds.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-400">
                <strong>{assignedPractitionerIds.length}</strong> practitioner
                {assignedPractitionerIds.length === 1 ? "" : "s"} selected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[150px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
