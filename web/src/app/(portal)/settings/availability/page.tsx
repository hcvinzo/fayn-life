/**
 * Availability Settings Page
 * Feature #16: Manage practitioner working schedule and exceptions
 */

import { AvailabilitySettings } from '@/components/portal/availability-settings'

export default function AvailabilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Availability Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your working hours and schedule exceptions
        </p>
      </div>

      <AvailabilitySettings />
    </div>
  )
}
