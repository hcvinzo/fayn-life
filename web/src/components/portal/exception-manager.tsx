/**
 * Exception Manager Component
 * Feature #16: UI for managing schedule exceptions (time off, modified hours, etc.)
 */

'use client'

import { useState, useEffect } from 'react'
import { exceptionApi } from '@/lib/api/availability-api'
import type {
  AvailabilityException,
  AvailabilityStatus,
  AvailabilityExceptionInput,
} from '@/types/availability'
import { AVAILABILITY_STATUS_LABELS } from '@/types/availability'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export function ExceptionManager() {
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('off')
  const [startDateTime, setStartDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [description, setDescription] = useState('')

  // Calendar/time picker state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [endTime, setEndTime] = useState<string | null>(null)

  // Generate time slots (15-minute intervals, 9 AM - 6 PM)
  const timeSlots = Array.from({ length: 37 }, (_, i) => {
    const totalMinutes = i * 15
    const hour = Math.floor(totalMinutes / 60) + 9
    const minute = totalMinutes % 60
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  useEffect(() => {
    loadExceptions()
  }, [])

  // Sync startDate + startTime to startDateTime string
  useEffect(() => {
    if (startDate && startTime) {
      const [hours, minutes] = startTime.split(':')
      const datetime = new Date(startDate)
      datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      setStartDateTime(datetime.toISOString().slice(0, 16))
    }
  }, [startDate, startTime])

  // Sync endDate + endTime to endDateTime string
  useEffect(() => {
    if (endDate && endTime) {
      const [hours, minutes] = endTime.split(':')
      const datetime = new Date(endDate)
      datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      setEndDateTime(datetime.toISOString().slice(0, 16))
    }
  }, [endDate, endTime])

  const loadExceptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await exceptionApi.getAll(true)
      setExceptions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exceptions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateException = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Validate date and time selection
      if (!startDate || !startTime) {
        setError('Please select a start date and time')
        setSaving(false)
        return
      }

      if (!endDate || !endTime) {
        setError('Please select an end date and time')
        setSaving(false)
        return
      }

      // Validate that startDateTime and endDateTime are valid
      if (!startDateTime || !endDateTime) {
        setError('Please select valid start and end dates/times')
        setSaving(false)
        return
      }

      const input: AvailabilityExceptionInput = {
        availability_status: availabilityStatus,
        start_datetime: new Date(startDateTime).toISOString(),
        end_datetime: new Date(endDateTime).toISOString(),
        description: description || undefined,
      }

      await exceptionApi.create(input)
      setSuccess('Exception created successfully')
      setDialogOpen(false)
      resetForm()
      await loadExceptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exception')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteException = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exception?')) {
      return
    }

    try {
      await exceptionApi.delete(id)
      setSuccess('Exception deleted successfully')
      await loadExceptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exception')
    }
  }

  const resetForm = () => {
    setAvailabilityStatus('off')
    setStartDateTime('')
    setEndDateTime('')
    setDescription('')
    setStartDate(undefined)
    setStartTime(null)
    setEndDate(undefined)
    setEndTime(null)
    setError(null)
  }

  const getAvailabilityBadgeVariant = (status: AvailabilityStatus) => {
    switch (status) {
      case 'off':
        return 'destructive'
      case 'online_only':
        return 'default'
      case 'in_person_only':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const formatDateTime = (datetime: string) => {
    try {
      return format(parseISO(datetime), 'MMM dd, yyyy h:mm a')
    } catch {
      return datetime
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Schedule Exceptions</CardTitle>
              <CardDescription>
                Set periods when you're off, or only available for specific appointment types
              </CardDescription>
            </div>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open)
                if (!open) {
                  resetForm() // Reset form when dialog closes
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exception
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Schedule Exception</DialogTitle>
                  <DialogDescription>
                    Add a time period with different availability rules
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Error Alert - Inside Modal */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {/* Availability Status */}
                  <div className="space-y-2">
                    <Label>Availability</Label>
                    <Select
                      value={availabilityStatus}
                      onValueChange={(value) => setAvailabilityStatus(value as AvailabilityStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off (Unavailable)</SelectItem>
                        <SelectItem value="online_only">Only Online</SelectItem>
                        <SelectItem value="in_person_only">Only In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range with Calendar + Time Picker */}
                  <div className="space-y-6">
                    {/* Start Date & Time */}
                    <div className="space-y-2">
                      <Label>Start Date & Time</Label>
                      <Card className="gap-0 p-0">
                        <CardContent className="relative p-0 md:pr-48">
                          <div className="p-6">
                            <CalendarComponent
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              defaultMonth={startDate}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              className="bg-transparent p-0"
                            />
                          </div>
                          <div className="inset-y-0 right-0 flex w-full flex-col gap-4 border-t max-md:h-60 md:absolute md:w-48 md:border-t-0 md:border-l">
                            <ScrollArea className="h-full">
                              <div className="flex flex-col gap-2 p-6">
                                {timeSlots.map((time) => (
                                  <Button
                                    key={time}
                                    variant={startTime === time ? 'default' : 'outline'}
                                    onClick={() => setStartTime(time)}
                                    className="w-full shadow-none"
                                  >
                                    {time}
                                  </Button>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </CardContent>
                        {startDate && startTime && (
                          <div className="border-t px-6 py-3 text-sm text-muted-foreground">
                            Selected: {format(startDate, 'EEEE, MMMM d, yyyy')} at {startTime}
                          </div>
                        )}
                      </Card>
                    </div>

                    {/* End Date & Time */}
                    <div className="space-y-2">
                      <Label>End Date & Time</Label>
                      <Card className="gap-0 p-0">
                        <CardContent className="relative p-0 md:pr-48">
                          <div className="p-6">
                            <CalendarComponent
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              defaultMonth={endDate}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              className="bg-transparent p-0"
                            />
                          </div>
                          <div className="inset-y-0 right-0 flex w-full flex-col gap-4 border-t max-md:h-60 md:absolute md:w-48 md:border-t-0 md:border-l">
                            <ScrollArea className="h-full">
                              <div className="flex flex-col gap-2 p-6">
                                {timeSlots.map((time) => (
                                  <Button
                                    key={time}
                                    variant={endTime === time ? 'default' : 'outline'}
                                    onClick={() => setEndTime(time)}
                                    className="w-full shadow-none"
                                  >
                                    {time}
                                  </Button>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </CardContent>
                        {endDate && endTime && (
                          <div className="border-t px-6 py-3 text-sm text-muted-foreground">
                            Selected: {format(endDate, 'EEEE, MMMM d, yyyy')} at {endTime}
                          </div>
                        )}
                      </Card>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description{' '}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="e.g., Vacation, Conference, Emergency hours only"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateException} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Exception'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No exceptions scheduled. Click "Add Exception" to create one.
            </p>
          ) : (
            <div className="space-y-3">
              {exceptions.map((exception) => (
                <div
                  key={exception.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getAvailabilityBadgeVariant(exception.availability_status)}>
                        {AVAILABILITY_STATUS_LABELS[exception.availability_status]}
                      </Badge>
                      {exception.description && (
                        <span className="text-sm font-medium">{exception.description}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(exception.start_datetime)}
                      </div>
                      <span>→</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(exception.end_datetime)}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteException(exception.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
