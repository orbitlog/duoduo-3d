# 项目启动指南

## 🚀 快速开始

### 1. 安装依赖

首先，安装所有项目依赖：

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

然后在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
├── app/                           # Next.js App Router
│   ├── layout.tsx                # 根布局（包含全局样式）
│   ├── page.tsx                  # 首页导航
│   ├── globals.css               # 全局样式（Tailwind）
│   ├── mouse-trail/              
│   │   ├── basic/page.tsx        # 基础版鼠标轨迹页面
│   │   └── optimized/page.tsx    # 优化版鼠标轨迹页面
│   └── compare/page.tsx          # 性能对比页面
│
├── components/                    # React 组件
│   ├── BackButton.tsx            # 返回按钮组件
│   ├── PerformanceMonitor.tsx    # 性能监控组件（单页面）
│   ├── CompareMonitor.tsx        # 性能监控组件（对比页面）
│   ├── MouseTrail.tsx            # 基础版鼠标轨迹组件
│   ├── MouseTrailOptimized.tsx   # 优化版鼠标轨迹组件
│   ├── MouseTrailBasicCompare.tsx     # 对比页面-基础版
│   └── MouseTrailOptimizedCompare.tsx # 对比页面-优化版
│
├── lib/                          # 工具库和状态管理
│   ├── store.ts                  # Zustand 状态管理（单页面）
│   └── compareStore.ts           # Zustand 状态管理（对比页面）
│
├── public/                       # 静态资源
│
└── 配置文件
    ├── package.json              # 依赖管理
    ├── tsconfig.json             # TypeScript 配置
    ├── next.config.js            # Next.js 配置
    ├── tailwind.config.ts        # Tailwind CSS 配置
    ├── postcss.config.js         # PostCSS 配置
    ├── .eslintrc.json            # ESLint 配置
    └── .prettierrc               # Prettier 配置
```

## 🎯 功能说明

### 1. 首页导航（/）
- 展示三个主要功能模块的入口
- 现代化的 UI 设计
- 技术栈展示

### 2. 基础版鼠标轨迹（/mouse-trail/basic）
- 实时创建粒子跟随鼠标
- 粒子随时间渐隐消失
- 实时性能监控（右上角）

**实现特点：**
- 直接创建和销毁粒子对象
- 使用 THREE.Points 渲染
- 每次鼠标移动创建 3 个粒子
- 最多保持 1000 个粒子

### 3. 优化版鼠标轨迹（/mouse-trail/optimized）
- 相同的视觉效果
- 优化的性能表现
- 实时性能监控（右上角）

**优化技术：**
- **对象池模式**：预先创建粒子对象，复用而非频繁创建销毁
- **实例化渲染**：使用 THREE.InstancedMesh 减少 Draw Calls
- **事件节流**：鼠标事件每 16ms 处理一次（约 60fps）
- **粒子控制**：每次创建 2 个粒子（比基础版少）
- **内存优化**：最多 500 个粒子实例

### 4. 性能对比（/compare）
- 并排展示基础版和优化版
- 独立的性能监控面板
- 可以在任一侧移动鼠标查看效果

**对比指标：**
- **FPS**：帧率，越高越流畅
- **渲染时间**：每帧渲染耗时，越低越好
- **粒子数量**：当前活跃的粒子数
- **Draw Calls**：渲染调用次数，越少越好
- **内存使用**：JavaScript 堆内存使用量

## 📊 预期性能提升

优化版相比基础版的改进：

| 指标 | 基础版 | 优化版 | 提升 |
|------|--------|--------|------|
| Draw Calls | ~50-100 | ~1-5 | ↓ 50%+ |
| FPS | ~45-55 | ~55-60 | ↑ 20%+ |
| 内存稳定性 | 波动较大 | 稳定 | 更优 |
| 粒子创建开销 | 频繁 GC | 几乎无 | 显著改善 |

## 🛠️ 可用的脚本命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 🎨 技术栈详情

- **React 18**: 最新的 React 版本，支持并发特性
- **Next.js 14**: 使用 App Router 的现代化框架
- **TypeScript**: 类型安全的 JavaScript
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Three.js**: 强大的 3D 图形库
- **@react-three/fiber**: Three.js 的 React 渲染器
- **@react-three/drei**: 常用的 Three.js 辅助工具集
- **Zustand**: 轻量级状态管理库

## 📝 学习要点

### 1. Three.js 基础
- 场景（Scene）、相机（Camera）、渲染器（Renderer）
- 几何体（Geometry）和材质（Material）
- 粒子系统（Points / InstancedMesh）
- 动画循环（requestAnimationFrame）

### 2. 性能优化技术
- **对象池模式**：避免频繁的对象创建和垃圾回收
- **实例化渲染**：批量渲染相同几何体
- **事件节流**：控制事件处理频率
- **内存管理**：及时清理不再使用的资源

### 3. React 集成
- 使用 @react-three/fiber 的声明式 API
- useFrame hook 实现动画
- useEffect 管理副作用
- 动态导入（dynamic import）避免 SSR 问题

### 4. 状态管理
- Zustand 的简洁 API
- 跨组件共享性能数据
- 分离的 store 设计（单页面 vs 对比页面）

## 🚢 部署

项目配置为静态导出，可以部署到任何静态托管平台：

### Vercel（推荐）
```bash
npm run build
```
然后推送到 GitHub，Vercel 会自动部署。

### 其他平台
构建后的静态文件位于 `out` 目录，可以直接部署。

## 💡 扩展建议

1. **添加更多效果**
   - 尾迹效果
   - 颜色主题切换
   - 不同的粒子形状

2. **性能分析工具**
   - 集成 React DevTools Profiler
   - 添加性能图表可视化
   - 导出性能数据

3. **交互增强**
   - 鼠标点击产生爆炸效果
   - 键盘快捷键控制
   - 触摸屏支持

4. **教学模式**
   - 代码高亮展示
   - 步骤说明
   - 交互式教程

## 🐛 常见问题

### 1. 启动报错：找不到模块
确保已正确安装所有依赖：
```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. Three.js 相关类型错误
确保安装了 @types/three：
```bash
npm install --save-dev @types/three
```

### 3. 性能监控显示异常
某些浏览器可能不支持 `performance.memory`，这是正常的，不影响核心功能。

### 4. 页面刷新后样式丢失
确保 Tailwind CSS 的配置文件中包含了正确的 content 路径。

## 📚 学习资源

- [Three.js 官方文档](https://threejs.org/docs/)
- [React Three Fiber 文档](https://docs.pmnd.rs/react-three-fiber/)
- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

祝学习愉快！ 🎉
