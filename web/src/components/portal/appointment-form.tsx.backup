"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { clientApi, type Client } from "@/lib/api/client-api";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Form schema - reordered with duration first, then date/time
const appointmentFormSchema = z.object({
  client_id: z.string().uuid('Please select a client'),
  appointment_type: z.enum(['in_person', 'online']),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 8 hours'),
  date: z.date({ message: 'Please select a date' }),
  time: z.string({ message: 'Please select a time' }).min(1, 'Please select a time'),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional().or(z.literal('')),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  defaultValues?: Partial<{
    client_id: string;
    appointment_type: 'in_person' | 'online';
    duration: number;
    date: string; // ISO date string from API
    time: string; // HH:MM format
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
  }>;
  onSubmit: (data: {
    client_id: string;
    appointment_type: 'in_person' | 'online';
    start_time: string;
    end_time: string;
    status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
  }) => Promise<void>;
  submitLabel?: string;
}

/**
 * Reusable Appointment Form Component
 * Used for both creating and editing appointments
 * Updated with shadcn calendar and time presets (GitHub Issue #11)
 */
export function AppointmentForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Appointment",
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // Generate time slots from 9:00 AM to 6:00 PM in 15-minute intervals
  const timeSlots = Array.from({ length: 37 }, (_, i) => {
    const totalMinutes = i * 15;
    const hour = Math.floor(totalMinutes / 60) + 9;
    const minute = totalMinutes % 60;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  });

  // Convert API date string to Date object for calendar
  const convertedDefaultValues = defaultValues
    ? {
        ...defaultValues,
        date: defaultValues.date ? new Date(defaultValues.date) : undefined,
      }
    : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      status: "scheduled",
      appointment_type: "in_person", // Default to in-person
      duration: 60, // Default to 60 minutes
      time: "", // Default to empty string to prevent undefined
      ...convertedDefaultValues,
    },
  });

  // Load active clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const data = await clientApi.getAll({ status: 'active' });
        setClients(data);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  const onFormSubmit = async (data: AppointmentFormData) => {
    try {
      setIsSubmitting(true);

      // Combine date and time to create start_time
      const year = data.date.getFullYear();
      const month = String(data.date.getMonth() + 1).padStart(2, '0');
      const day = String(data.date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const startDateTime = new Date(`${dateString}T${data.time}`);

      // Calculate end_time based on duration
      const endDateTime = new Date(startDateTime.getTime() + data.duration * 60000);

      // Convert to ISO strings
      const submitData = {
        client_id: data.client_id,
        appointment_type: data.appointment_type,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: data.status,
        notes: data.notes || undefined,
      };

      await onSubmit(submitData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch values for calculated end time
  const duration = watch('duration');
  const date = watch('date');
  const time = watch('time');

  const calculatedEndTime = () => {
    if (!date || !time || !duration) return '';
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const startDateTime = new Date(`${dateString}T${time}`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
      return endDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Get today's date at midnight for comparison (prevent past dates)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Appointment Details Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Appointment Details
        </h2>

        <div className="grid grid-cols-1 gap-6">
          {/* Client Selection */}
          <div>
            <label
              htmlFor="client_id"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Client <span className="text-red-500">*</span>
            </label>
            {loadingClients ? (
              <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500">
                Loading clients...
              </div>
            ) : (
              <select
                {...register("client_id")}
                id="client_id"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            )}
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.client_id.message}
              </p>
            )}
          </div>

          {/* Appointment Type */}
          <div>
            <label
              htmlFor="appointment_type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Appointment Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("appointment_type")}
              id="appointment_type"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select appointment type</option>
              <option value="in_person">In-Person</option>
              <option value="online">Online</option>
            </select>
            {errors.appointment_type && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.appointment_type.message}
              </p>
            )}
          </div>

          {/* Duration - Moved to top per requirements */}
          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Duration <span className="text-red-500">*</span>
            </label>
            <select
              {...register("duration", { valueAsNumber: true })}
              id="duration"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.duration.message}
              </p>
            )}
          </div>

          {/* Date and Time Picker with ShadCN Calendar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <Card className="gap-0 p-0">
              <CardContent className="relative p-0 md:pr-48">
                <div className="p-6">
                  <Controller
                    control={control}
                    name="date"
                    render={({ field }) => (
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < today}
                        defaultMonth={field.value}
                        showOutsideDays={false}
                        className="bg-transparent p-0 [--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
                        formatters={{
                          formatWeekdayName: (date) => {
                            return date.toLocaleString("en-US", { weekday: "short" });
                          },
                        }}
                      />
                    )}
                  />
                </div>
                <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l">
                  <div className="grid gap-2">
                    <Controller
                      control={control}
                      name="time"
                      render={({ field }) => (
                        <>
                          {timeSlots.map((slot) => (
                            <Button
                              key={slot}
                              type="button"
                              variant={field.value === slot ? "default" : "outline"}
                              onClick={() => field.onChange(slot)}
                              className="w-full shadow-none"
                            >
                              {slot}
                            </Button>
                          ))}
                        </>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 border-t px-6 !py-5 md:flex-row">
                <div className="text-sm">
                  {date && time ? (
                    <>
                      Appointment scheduled for{" "}
                      <span className="font-medium">
                        {date.toLocaleDateString("en-US", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>{" "}
                      at <span className="font-medium">{time}</span>
                      {calculatedEndTime() && (
                        <>
                          {" "}
                          (ends at <span className="font-medium">{calculatedEndTime()}</span>)
                        </>
                      )}
                    </>
                  ) : (
                    <>Select a date and time for the appointment.</>
                  )}
                </div>
              </CardFooter>
            </Card>
            {errors.date && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.date.message}
              </p>
            )}
            {errors.time && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.time.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Status
            </label>
            <select
              {...register("status")}
              id="status"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.status.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notes
        </h2>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Appointment Notes
          </label>
          <textarea
            {...register("notes")}
            id="notes"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Any additional information about the appointment..."
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.notes.message}
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
