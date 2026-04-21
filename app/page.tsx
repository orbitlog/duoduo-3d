import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            3D Project
          </h1>
          <p className="text-gray-400 text-xl">
            基于 Three.js 的鼠标轨迹光效与性能优化示例
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* 基础版本 */}
          <Link
            href="/mouse-trail/basic"
            className="group relative overflow-hidden rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-blue-500 transition-all duration-300 p-6"
          >
            <div className="mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                基础版本
              </h2>
              <p className="text-gray-400">
                基础鼠标轨迹粒子效果，实时创建和销毁粒子
              </p>
            </div>
            <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
              查看演示 →
            </div>
          </Link>

          {/* 优化版本 */}
          <Link
            href="/mouse-trail/optimized"
            className="group relative overflow-hidden rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-purple-500 transition-all duration-300 p-6"
          >
            <div className="mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                优化版本
              </h2>
              <p className="text-gray-400">
                使用对象池和实例化渲染的优化版本
              </p>
            </div>
            <div className="text-purple-400 group-hover:text-purple-300 transition-colors">
              查看演示 →
            </div>
          </Link>

          {/* 性能对比 */}
          <Link
            href="/compare"
            className="group relative overflow-hidden rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-green-500 transition-all duration-300 p-6"
          >
            <div className="mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                性能对比
              </h2>
              <p className="text-gray-400">
                并排对比两个版本的性能指标和渲染效果
              </p>
            </div>
            <div className="text-green-400 group-hover:text-green-300 transition-colors">
              查看对比 →
            </div>
          </Link>


          {/* 五角星 */}
          <Link
            href="/star"
            className="group relative overflow-hidden rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-green-500 transition-all duration-300 p-6"
          >
            <div className="mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⭐️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                五角星
              </h2>
              <p className="text-gray-400">
                五角星效果
              </p>
            </div>
            <div className="text-green-400 group-hover:text-green-300 transition-colors">
              查看对比 →
            </div>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-white mb-2">技术栈</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                React 18
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                Next.js 14
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                Three.js
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                @react-three/fiber
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                TypeScript
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                Tailwind CSS
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
