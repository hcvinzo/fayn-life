/**
 * Availability Settings Component
 * Feature #16: UI for managing practitioner schedule
 */

'use client'

import { useState, useEffect } from 'react'
import { availabilityApi } from '@/lib/api/availability-api'
import type {
  PractitionerAvailability,
  DayOfWeek,
  BulkAvailabilityInput,
} from '@/types/availability'
import type { AppointmentType } from '@/types/appointment'
import { DAY_NAMES } from '@/types/availability'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Trash2, Clock, Calendar } from 'lucide-react'
import { ExceptionManager } from './exception-manager'

export function AvailabilitySettings() {
  const [schedule, setSchedule] = useState<PractitionerAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Bulk set form state
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5])
  const [selectedType, setSelectedType] = useState<AppointmentType>('in_person')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')

  useEffect(() => {
    loadSchedule()
  }, [])

  const loadSchedule = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await availabilityApi.getSchedule()
      setSchedule(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSet = async () => {
    if (selectedDays.length === 0) {
      setError('Please select at least one day')
      return
    }

    if (!startTime || !endTime) {
      setError('Please select start and end times')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const input: BulkAvailabilityInput = {
        days: selectedDays,
        appointment_type: selectedType,
        start_time: startTime,
        end_time: endTime,
      }

      await availabilityApi.setBulk(input)
      setSuccess(`Successfully set availability for ${selectedDays.length} day(s)`)
      await loadSchedule()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set availability')
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = async () => {
    if (!confirm('This will reset your schedule to Mon-Fri, 9 AM - 5 PM for both appointment types. Continue?')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      await availabilityApi.resetToDefaults()
      setSuccess('Schedule reset to defaults successfully')
      await loadSchedule()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset schedule')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) {
      return
    }

    try {
      await availabilityApi.deleteSlot(id)
      setSuccess('Time slot deleted successfully')
      await loadSchedule()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete slot')
    }
  }

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const selectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5])
  }

  const selectWeekend = () => {
    setSelectedDays([0, 6])
  }

  const selectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6])
  }

  // Group schedule by day and type
  const groupedSchedule = schedule.reduce((acc, slot) => {
    const key = `${slot.day_of_week}-${slot.appointment_type}`
    acc[key] = slot
    return acc
  }, {} as Record<string, PractitionerAvailability>)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedule">
            <Clock className="h-4 w-4 mr-2" />
            Regular Schedule
          </TabsTrigger>
          <TabsTrigger value="exceptions">
            <Calendar className="h-4 w-4 mr-2" />
            Exceptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          {/* Bulk Set Form */}
          <Card>
            <CardHeader>
              <CardTitle>Set Working Hours</CardTitle>
              <CardDescription>
                Set your availability for multiple days at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Day Selection */}
              <div className="space-y-3">
                <Label>Select Days</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectWeekdays}
                  >
                    Weekdays
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectWeekend}
                  >
                    Weekend
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllDays}
                  >
                    All Days
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={selectedDays.includes(day)}
                        onCheckedChange={() => toggleDay(day)}
                      />
                      <Label
                        htmlFor={`day-${day}`}
                        className="text-sm cursor-pointer"
                      >
                        {DAY_NAMES[day].slice(0, 3)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appointment Type */}
              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) =>
                    setSelectedType(value as AppointmentType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In-Person</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleBulkSet} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Set Availability
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetToDefaults}
                  disabled={saving}
                >
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Schedule Display */}
          <Card>
            <CardHeader>
              <CardTitle>Current Schedule</CardTitle>
              <CardDescription>
                Your weekly availability by appointment type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedule.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No availability set. Use the form above to set your working hours.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* In-Person Schedule */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">In-Person Appointments</h3>
                    <div className="grid gap-2">
                      {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => {
                        const slot = groupedSchedule[`${day}-in_person`]
                        return (
                          <div
                            key={`in_person-${day}`}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <span className="font-medium">{DAY_NAMES[day]}</span>
                              {slot ? (
                                <span className="ml-4 text-sm text-muted-foreground">
                                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                </span>
                              ) : (
                                <span className="ml-4 text-sm text-muted-foreground italic">
                                  Not available
                                </span>
                              )}
                            </div>
                            {slot && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSlot(slot.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Online Schedule */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Online Appointments</h3>
                    <div className="grid gap-2">
                      {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => {
                        const slot = groupedSchedule[`${day}-online`]
                        return (
                          <div
                            key={`online-${day}`}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <span className="font-medium">{DAY_NAMES[day]}</span>
                              {slot ? (
                                <span className="ml-4 text-sm text-muted-foreground">
                                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                </span>
                              ) : (
                                <span className="ml-4 text-sm text-muted-foreground italic">
                                  Not available
                                </span>
                              )}
                            </div>
                            {slot && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSlot(slot.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions">
          <ExceptionManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
