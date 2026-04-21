'use client'

import { usePerformanceStore } from '@/lib/store'
import { useEffect, useState } from 'react'

export default function PerformanceMonitor() {
  const { fps, renderTime, particleCount, drawCalls, memoryUsage } =
    usePerformanceStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg font-mono text-sm space-y-2 min-w-[200px] border border-gray-700">
      <div className="font-bold text-lg mb-2 text-blue-400">性能监控</div>
      <div className="flex justify-between">
        <span className="text-gray-400">FPS:</span>
        <span className={fps < 30 ? 'text-red-400' : 'text-green-400'}>
          {fps.toFixed(1)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">渲染时间:</span>
        <span>{renderTime.toFixed(2)}ms</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">粒子数:</span>
        <span>{particleCount}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Draw Calls:</span>
        <span>{drawCalls}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">内存:</span>
        <span>{memoryUsage.toFixed(2)}MB</span>
      </div>
    </div>
  )
}
