# 3D Learning Project

基于 Next.js + Three.js 的3D学习项目，演示鼠标轨迹光效的实现与性能优化。

## 技术栈

- React 18 + Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Three.js + @react-three/fiber + @react-three/drei
- Zustand (状态管理)

## 功能特性

- ✨ **基础版鼠标轨迹**: 实时创建粒子跟随鼠标
- 🚀 **优化版实现**: 对象池、实例化渲染等优化技术
- 📊 **性能对比**: 实时监控和对比两个版本的性能指标

## 快速开始

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
├── app/                      # Next.js App Router
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页导航
│   ├── mouse-trail/         # 鼠标轨迹效果
│   │   ├── basic/          # 基础版本
│   │   └── optimized/      # 优化版本
│   └── compare/            # 性能对比页面
├── components/              # 公共组件
│   ├── PerformanceMonitor.tsx
│   └── BackButton.tsx
└── lib/                     # 工具函数
    └── store.ts            # Zustand状态管理
```

## 性能优化技术

1. **对象池模式**: 复用粒子对象避免频繁创建销毁
2. **实例化渲染**: 使用 InstancedMesh 减少 Draw Calls
3. **节流优化**: 优化鼠标事件监听频率
4. **内存管理**: 及时清理不再使用的资源

## 部署

项目配置为静态导出，可以直接部署到 Vercel、Netlify 等平台：

```bash
npm run build
```

## License

MIT
