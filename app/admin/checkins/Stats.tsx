'use client'

import { Mail, CheckCircle, XCircle, Clock, TrendingUp, DollarSign } from 'lucide-react'

interface StatsProps {
  dueNow: number
  sent24h: number
  failed24h: number
  responses24h: number
  revenue24h: number
}

export default function Stats({ dueNow, sent24h, failed24h, responses24h, revenue24h }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Due Now</p>
            <p className="text-2xl font-bold text-gray-900">{dueNow}</p>
          </div>
          <Clock className="h-8 w-8 text-yellow-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Sent (24h)</p>
            <p className="text-2xl font-bold text-gray-900">{sent24h}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Failed (24h)</p>
            <p className="text-2xl font-bold text-gray-900">{failed24h}</p>
          </div>
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Responses (24h)</p>
            <p className="text-2xl font-bold text-gray-900">{responses24h}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Revenue (24h)</p>
            <p className="text-2xl font-bold text-gray-900">${(revenue24h / 100).toFixed(2)}</p>
          </div>
          <DollarSign className="h-8 w-8 text-purple-500" />
        </div>
      </div>
    </div>
  )
}