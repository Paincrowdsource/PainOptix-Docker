import { Suspense } from 'react'
import MonitoringContent from './MonitoringContent'

export default function MonitoringPage() {
  return (
    <Suspense fallback={<div>Loading monitoring data...</div>}>
      <MonitoringContent />
    </Suspense>
  )
}