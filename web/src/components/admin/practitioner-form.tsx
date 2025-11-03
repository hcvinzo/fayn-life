"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  createPractitionerSchema,
  updatePractitionerSchema,
  type CreatePractitionerInput,
  type UpdatePractitionerInput,
} from "@/lib/validators/practitioner-schema";
import { practiceApi, type Practice } from "@/lib/api/practice-api";

type PractitionerFormData = CreatePractitionerInput | UpdatePractitionerInput;

interface PractitionerFormProps {
  defaultValues?: Partial<PractitionerFormData>;
  onSubmit: (data: PractitionerFormData) => Promise<void>;
  submitLabel?: string;
  isEditMode?: boolean;
}

/**
 * Reusable Practitioner Form Component
 * Used for both creating and editing practitioners
 */
export function PractitionerForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Practitioner",
  isEditMode = false,
}: PractitionerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loadingPractices, setLoadingPractices] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PractitionerFormData>({
    resolver: zodResolver(isEditMode ? updatePractitionerSchema : createPractitionerSchema),
    defaultValues: {
      status: "active",
      role: "practitioner",
      ...defaultValues,
    },
  });

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

  const onFormSubmit = async (data: PractitionerFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
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
                placeholder="John Doe"
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
                placeholder="john.doe@example.com"
                disabled={isEditMode}
              />
              {errors.email && (
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

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Role <span className="text-red-500">*</span>
              </label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="practitioner">Practitioner</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.role.message}
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

            {/* Practice */}
            <div className="md:col-span-2">
              <label
                htmlFor="practice_id"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Practice (Optional)
              </label>
              <Controller
                name="practice_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    defaultValue={field.value || "none"}
                    value={field.value || "none"}
                    disabled={loadingPractices}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingPractices ? "Loading practices..." : "Select practice"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Practice</SelectItem>
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
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Assign practitioner to a practice or leave unassigned
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button variant="default" disabled={isSubmitting} type="submit">
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
