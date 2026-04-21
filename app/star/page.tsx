'use client'

import dynamic from 'next/dynamic'
import BackButton from '@/components/BackButton'
import PerformanceMonitor from '@/components/PerformanceMonitor'

const Star = dynamic(() => import('@/components/Star'), {
  ssr: false,
})

export default function StarPage() {
  return (
    <div className="w-full h-screen relative">
      <BackButton />
      <PerformanceMonitor />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
        <h1 className="text-4xl font-bold text-white/80 mb-2">
          五角星效果
        </h1>
        <p className="text-gray-400">移动鼠标查看粒子效果</p>
      </div>

      <div className="absolute inset-0 -z-10">
        <Star />
      </div>
    </div>
  )
}