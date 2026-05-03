import InkTrailRibbon from '@/components/InkTrailRibbon'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import BackButton from '@/components/BackButton'

export default function InkTrailPage() {
  return (
    <div className="relative w-full h-screen">
      <InkTrailRibbon />
      <PerformanceMonitor />
      <BackButton />
      
      {/* 提示文字 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          墨水波纹拖尾
        </h1>
        <p className="text-gray-600">
          使用 GLSL Shader 实现的墨水书法效果 🖋️
        </p>
      </div>

      {/* 技术说明 */}
      <div className="absolute bottom-20 left-4 bg-white/80 backdrop-blur-sm rounded-lg p-4 max-w-xs text-sm pointer-events-none">
        <h3 className="font-bold text-gray-800 mb-2">✨ 技术亮点</h3>
        <ul className="space-y-1 text-gray-700">
          <li>• 连续轨迹带（Trail Ribbon）方案</li>
          <li>• 动态生成四边形条带连接路径</li>
          <li>• 自定义 GLSL Shader 渲染墨水</li>
          <li>• 噪声函数制造不规则边缘</li>
          <li>• 无缝连续，不受速度影响</li>
          <li>• 无粒子数量限制问题</li>
        </ul>
      </div>
    </div>
  )
}
