/**
 * Exception Dialog Component
 * Reusable dialog for creating availability exceptions
 * Can be used standalone or from anywhere in the app
 */

'use client'

import { useState, useEffect } from 'react'
import { exceptionApi } from '@/lib/api/availability-api'
import type {
  AvailabilityStatus,
  AvailabilityExceptionInput,
} from '@/types/availability'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface ExceptionDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function ExceptionDialog({
  open,
  onOpenChange,
  onSuccess,
  trigger,
}: ExceptionDialogProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(open ?? false)

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

  // Sync controlled dialog state
  useEffect(() => {
    if (open !== undefined) {
      setDialogOpen(open)
    }
  }, [open])

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

  const handleCreateException = async () => {
    try {
      setSaving(true)
      setError(null)

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

      // Close dialog and reset form
      const newDialogState = false
      setDialogOpen(newDialogState)
      if (onOpenChange) onOpenChange(newDialogState)
      resetForm()

      // Call success callback
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exception')
    } finally {
      setSaving(false)
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

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (onOpenChange) onOpenChange(open)
    if (!open) {
      resetForm()
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Schedule Exception</DialogTitle>
          <DialogDescription>
            Set a period when you're off or only available for specific appointment types
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
              placeholder="e.g., Vacation, Conference, Traveling"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogChange(false)}>
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
  )
}
