// This is NOT a full replacement unless your page matches this structure.
// Use it as a copy-paste guide for your existing doctor detail page.

import { useQueryClient } from '@tanstack/react-query'
import { DoctorAccountPanel } from './components/doctors/DoctorAccountPanel'

export function ExampleUsageInsideDoctorDetailsPage({ hospitalDoctor }: { hospitalDoctor: any }) {
  const queryClient = useQueryClient()

  return (
    <div className="space-y-6">
      {/* Existing doctor header/details cards here */}

      <DoctorAccountPanel
        hospitalDoctor={hospitalDoctor}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['hospital-doctors'] })
          queryClient.invalidateQueries({ queryKey: ['hospital-doctor', hospitalDoctor.id] })
        }}
      />

      {/* Existing availability/appointments/etc. here */}
    </div>
  )
}
