'use client'

import { useCompareStore } from '@/lib/compareStore'
import { useEffect, useState } from 'react'

interface CompareMonitorProps {
  version: 'basic' | 'optimized'
  title: string
  color: string
}

export default function CompareMonitor({
  version,
  title,
  color,
}: CompareMonitorProps) {
  const metrics = useCompareStore(state => state[version])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const borderColor = version === 'basic' ? 'border-blue-500' : 'border-purple-500'
  const textColor = version === 'basic' ? 'text-blue-400' : 'text-purple-400'

  return (
    <div
      className={`bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg font-mono text-sm space-y-2 min-w-[200px] border ${borderColor}`}
    >
      <div className={`font-bold text-lg mb-2 ${textColor}`}>{title}</div>
      <div className="flex justify-between">
        <span className="text-gray-400">FPS:</span>
        <span className={metrics.fps < 30 ? 'text-red-400' : 'text-green-400'}>
          {metrics.fps.toFixed(1)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">渲染时间:</span>
        <span>{metrics.renderTime.toFixed(2)}ms</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">粒子数:</span>
        <span>{metrics.particleCount}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Draw Calls:</span>
        <span>{metrics.drawCalls}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">内存:</span>
        <span>{metrics.memoryUsage.toFixed(2)}MB</span>
      </div>
    </div>
  )
}
