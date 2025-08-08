import { Suspense } from 'react'
import LogsContent from './LogsContent'

export default function LogsPage() {
  return (
    <Suspense fallback={<div>Loading logs...</div>}>
      <LogsContent />
    </Suspense>
  )
}