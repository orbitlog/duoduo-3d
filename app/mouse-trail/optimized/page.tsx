'use client'

import dynamic from 'next/dynamic'
import BackButton from '@/components/BackButton'
import PerformanceMonitor from '@/components/PerformanceMonitor'

const MouseTrailOptimized = dynamic(
  () => import('@/components/MouseTrailOptimized'),
  { ssr: false }
)

export default function OptimizedMouseTrailPage() {
  return (
    <div className="w-full h-screen relative">
      <BackButton />
      <PerformanceMonitor />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
        <h1 className="text-4xl font-bold text-white/80 mb-2">
          优化版鼠标轨迹
        </h1>
        <p className="text-gray-400 mb-4">移动鼠标查看粒子效果</p>
        <div className="inline-block bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-500/30">
          <p className="text-purple-300 text-sm">
            ✨ 对象池 + 实例化渲染 + 事件节流
          </p>
        </div>
      </div>

      <div className="absolute inset-0 -z-10">
        <MouseTrailOptimized />
      </div>
    </div>
  )
}
