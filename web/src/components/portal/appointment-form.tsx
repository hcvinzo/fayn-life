"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { clientApi, type Client } from "@/lib/api/client-api";
import { availabilityCheckApi } from "@/lib/api/availability-api";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { useAssignedPractitioners } from "@/hooks/use-assigned-practitioners";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Form schema
const appointmentFormSchema = z.object({
  client_id: z.string().min(1, 'Please select a client'),
  practitioner_id: z.string().min(1, 'Please select a practitioner').optional(), // Optional for practitioners, required for assistants
  appointment_type: z.enum(['in_person', 'online']),
  duration: z.number().min(15).max(480),
  date: z.date({ message: 'Please select a date' }),
  time: z.string().min(1, 'Please select a time'),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  defaultValues?: Partial<{
    client_id: string;
    practitioner_id?: string;
    appointment_type: 'in_person' | 'online';
    duration: number;
    date: string;
    time: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
  }>;
  onSubmit: (data: {
    client_id: string;
    practitioner_id: string;
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
 * Uses ShadCN Form components with new teal design system
 */
export function AppointmentForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Appointment",
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const { isAssistant } = usePermissions();
  const { profile } = useAuth();
  const { practitioners: assignedPractitioners, isLoading: loadingPractitioners } = useAssignedPractitioners();

  const timeSlots = Array.from({ length: 37 }, (_, i) => {
    const totalMinutes = i * 15;
    const hour = Math.floor(totalMinutes / 60) + 9;
    const minute = totalMinutes % 60;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  });

  const convertedDefaultValues = defaultValues
    ? {
        ...defaultValues,
        date: defaultValues.date ? new Date(defaultValues.date) : undefined,
      }
    : undefined;

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      status: "scheduled",
      appointment_type: "in_person",
      duration: 60,
      time: "",
      // For practitioners, pre-fill their own ID
      practitioner_id: !isAssistant && profile?.id ? profile.id : undefined,
      ...convertedDefaultValues,
    },
  });

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
      setAvailabilityError(null);

      const year = data.date.getFullYear();
      const month = String(data.date.getMonth() + 1).padStart(2, '0');
      const day = String(data.date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const startDateTime = new Date(`${dateString}T${data.time}`);
      const endDateTime = new Date(startDateTime.getTime() + data.duration * 60000);

      // Check availability before submitting
      try {
        const availabilityCheck = await availabilityCheckApi.check({
          appointment_type: data.appointment_type,
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
        });

        if (!availabilityCheck.available) {
          setAvailabilityError(
            availabilityCheck.reason ||
            'You are not available during this time slot. Please check your availability settings.'
          );
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailabilityError('Failed to verify availability. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // For practitioners, use their own ID if not specified
      // For assistants, use the selected practitioner_id (required)
      const practitionerId = data.practitioner_id || profile?.id;

      if (!practitionerId) {
        setAvailabilityError('Practitioner ID is required');
        setIsSubmitting(false);
        return;
      }

      await onSubmit({
        client_id: data.client_id,
        practitioner_id: practitionerId,
        appointment_type: data.appointment_type,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: data.status,
        notes: data.notes || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const duration = form.watch('duration');
  const date = form.watch('date');
  const time = form.watch('time');

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        {availabilityError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{availabilityError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-6">Appointment Details</h2>
            <div className="grid grid-cols-1 gap-6">
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={loadingClients}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingClients ? "Loading..." : "Select a client"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Practitioner Selection - Only for Assistants */}
              {isAssistant && (
                <FormField
                  control={form.control}
                  name="practitioner_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practitioner *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={loadingPractitioners}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingPractitioners ? "Loading..." : "Select a practitioner"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assignedPractitioners.map((practitioner) => (
                            <SelectItem key={practitioner.id} value={practitioner.id}>
                              {practitioner.full_name || practitioner.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        You can only create appointments for assigned practitioners
                      </p>
                    </FormItem>
                  )}
                />
              )}

              {/* Appointment Type */}
              <FormField
                control={form.control}
                name="appointment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appointment Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_person">In-Person</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date and Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Date & Time *
                </label>
                <Card className="gap-0 p-0">
                  <CardContent className="relative p-0 md:pr-48">
                    <div className="p-6">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < today}
                            defaultMonth={field.value}
                            showOutsideDays={false}
                            className="bg-transparent p-0"
                          />
                        )}
                      />
                    </div>
                    <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l">
                      <div className="grid gap-2">
                        <FormField
                          control={form.control}
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
                              {" "}(ends at <span className="font-medium">{calculatedEndTime()}</span>)
                            </>
                          )}
                        </>
                      ) : (
                        <>Select a date and time for the appointment.</>
                      )}
                    </div>
                  </CardFooter>
                </Card>
                {(form.formState.errors.date || form.formState.errors.time) && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.date?.message || form.formState.errors.time?.message}
                  </p>
                )}
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-6">Notes</h2>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Any additional information..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
