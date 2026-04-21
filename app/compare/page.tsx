'use client'

import dynamic from 'next/dynamic'
import BackButton from '@/components/BackButton'
import CompareMonitor from '@/components/CompareMonitor'

const MouseTrailBasicCompare = dynamic(
  () => import('@/components/MouseTrailBasicCompare'),
  { ssr: false }
)

const MouseTrailOptimizedCompare = dynamic(
  () => import('@/components/MouseTrailOptimizedCompare'),
  { ssr: false }
)

export default function ComparePage() {
  return (
    <div className="w-full h-screen relative">
      <BackButton />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">性能对比</h1>
        <p className="text-gray-400 text-sm">
          在任意一侧移动鼠标查看效果，观察两个版本的性能差异
        </p>
      </div>

      <div className="flex h-full">
        {/* 基础版 */}
        <div className="w-1/2 h-full relative border-r border-gray-700">
          <div className="absolute top-20 left-4 z-10">
            <CompareMonitor
              version="basic"
              title="基础版"
              color="blue"
            />
          </div>
          <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-500/30">
            <p className="text-blue-300 text-sm">
              基础实现 - 直接创建销毁
            </p>
          </div>
          <MouseTrailBasicCompare />
        </div>

        {/* 优化版 */}
        <div className="w-1/2 h-full relative">
          <div className="absolute top-20 right-4 z-10">
            <CompareMonitor
              version="optimized"
              title="优化版"
              color="purple"
            />
          </div>
          <div className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-500/30">
            <p className="text-purple-300 text-sm">
              对象池 + 实例化渲染
            </p>
          </div>
          <MouseTrailOptimizedCompare />
        </div>
      </div>

      {/* 性能优化说明 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-lg border border-green-500/30">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">
                优化技术: 对象池模式、实例化渲染、事件节流
              </span>
            </div>
            <div className="text-green-400 font-mono">
              预期提升: Draw Calls ↓50%+, FPS ↑20%+
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
