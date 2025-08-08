'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/admin/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Redirecting to dashboard...</div>
    </div>
  )
}