'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePerformanceStore } from '@/lib/store'

// ===== 墨水轨迹带 Shader =====
const vertexShader = `
  varying vec2 vUv;
  varying float vAlpha;
  
  attribute float alpha;
  
  void main() {
    vUv = uv;
    vAlpha = alpha;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform vec3 color;
  uniform float time;
  
  varying vec2 vUv;
  varying float vAlpha;
  
  // 噪声函数
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    // 从中心到边缘的距离（vUv.y 是横向，0.5 是中心）
    float distFromCenter = abs(vUv.y - 0.5) * 2.0;
    
    // 边缘噪声，制造不规则的墨水晕染
    float edgeNoise = noise(vec2(vUv.x * 25.0, vUv.y * 8.0) + time * 0.1);
    float edgeNoise2 = noise(vec2(vUv.x * 18.0, vUv.y * 12.0) + time * 0.05);
    
    // 柔和的边缘渐变，加上噪声产生晕染效果
    float edgeFade = smoothstep(1.0, 0.3, distFromCenter + edgeNoise * 0.15);
    
    // 沿轨迹方向的随机浓淡变化（模拟墨水不均匀）
    float inkVariation = 0.75 + noise(vec2(vUv.x * 12.0, vUv.y * 4.0)) * 0.25;
    
    // 添加细微的纹理感
    float texture = noise(vUv * 35.0 + time * 0.02) * 0.08;
    
    // 增加边缘晕染层
    float outerGlow = smoothstep(0.85, 0.4, distFromCenter + edgeNoise2 * 0.2);
    outerGlow *= (1.0 - smoothstep(0.4, 0.0, distFromCenter));
    outerGlow *= 0.3;
    
    // 最终透明度
    float alpha = (edgeFade + outerGlow) * vAlpha * inkVariation;
    
    // 颜色随透明度变化（边缘更浅）
    vec3 finalColor = mix(color * 0.6, color, edgeFade);
    
    gl_FragColor = vec4(finalColor + texture, alpha);
    
    if (alpha < 0.01) discard;
  }
`

// 轨迹点数据结构
interface TrailPoint {
  pos: THREE.Vector3
  age: number // 年龄（0-1，1是最新的）
}

function InkTrailRibbon() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { camera, gl } = useThree()
  const { setFps, setRenderTime, setParticleCount, setDrawCalls } = usePerformanceStore()

  const maxPoints = 100 // 最多保留100个轨迹点（样条曲线会插值更多点）
  const trailWidth = 1.2 // 轨迹宽度略大

  // 轨迹点队列
  const trailPoints = useRef<TrailPoint[]>([])
  const mouseWorldPos = useRef(new THREE.Vector3())
  const lastAddedPos = useRef(new THREE.Vector3())

  // 几何体和属性
  const geometryRef = useRef<THREE.BufferGeometry>(null!)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1
      const ny = -(event.clientY / window.innerHeight) * 2 + 1
      
      const vec = new THREE.Vector3(nx, ny, 0.5)
      vec.unproject(camera)
      const dir = vec.sub(camera.position).normalize()
      const distance = -camera.position.z / dir.z
      mouseWorldPos.current.copy(camera.position).add(dir.multiplyScalar(distance))
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera])

  // 创建或更新轨迹带几何体
  const updateTrailGeometry = (points: TrailPoint[]) => {
    if (points.length < 2) {
      // 没有足够的点，清空几何体
      if (geometryRef.current) {
        geometryRef.current.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3))
        geometryRef.current.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(0), 2))
        geometryRef.current.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(0), 1))
        geometryRef.current.setIndex([])
      }
      return
    }

    // ===== 核心改进：使用 Catmull-Rom 样条曲线平滑路径 =====
    let smoothedPoints: TrailPoint[] = []
    
    if (points.length >= 4) {
      // 提取位置创建样条曲线
      const curvePoints = points.map(p => p.pos)
      const curve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.3)
      
      // 在曲线上均匀采样（采样点数是原始点的2-3倍，让曲线更平滑）
      const sampleCount = Math.min(points.length * 2, 150)
      
      for (let i = 0; i < sampleCount; i++) {
        const t = i / (sampleCount - 1)
        const pos = curve.getPoint(t)
        
        // 插值计算对应的年龄（age）
        const originalIndex = t * (points.length - 1)
        const lowerIndex = Math.floor(originalIndex)
        const upperIndex = Math.ceil(originalIndex)
        const fraction = originalIndex - lowerIndex
        
        const lowerAge = points[lowerIndex]?.age || 0
        const upperAge = points[upperIndex]?.age || lowerAge
        const age = lowerAge * (1 - fraction) + upperAge * fraction
        
        smoothedPoints.push({ pos, age })
      }
    } else {
      // 点数太少，直接使用原始点
      smoothedPoints = points
    }

    const vertexCount = smoothedPoints.length * 2 // 每个点生成2个顶点（上下边缘）
    const positions = new Float32Array(vertexCount * 3)
    const uvs = new Float32Array(vertexCount * 2)
    const alphas = new Float32Array(vertexCount)
    const indices: number[] = []

    // 为每个轨迹点生成一个矩形条带
    smoothedPoints.forEach((point, i) => {
      const { pos, age } = point
      
      // 计算垂直于轨迹的方向（用于确定条带宽度）
      let perpendicular = new THREE.Vector3()
      if (i < smoothedPoints.length - 1) {
        // 使用到下一个点的方向
        const nextPos = smoothedPoints[i + 1].pos
        const direction = new THREE.Vector3().subVectors(nextPos, pos).normalize()
        perpendicular.set(-direction.y, direction.x, 0) // 2D垂直向量
      } else if (i > 0) {
        // 最后一个点，使用前一个点的方向
        const prevPos = smoothedPoints[i - 1].pos
        const direction = new THREE.Vector3().subVectors(pos, prevPos).normalize()
        perpendicular.set(-direction.y, direction.x, 0)
      }

      // 计算宽度（随年龄衰减）
      const width = trailWidth * age

      // 上下两个顶点
      const offset = perpendicular.multiplyScalar(width * 0.5)
      const topVertex = new THREE.Vector3().addVectors(pos, offset)
      const bottomVertex = new THREE.Vector3().subVectors(pos, offset)

      const idx = i * 2

      // 位置
      positions[idx * 3] = topVertex.x
      positions[idx * 3 + 1] = topVertex.y
      positions[idx * 3 + 2] = topVertex.z

      positions[(idx + 1) * 3] = bottomVertex.x
      positions[(idx + 1) * 3 + 1] = bottomVertex.y
      positions[(idx + 1) * 3 + 2] = bottomVertex.z

      // UV坐标
      const u = i / (smoothedPoints.length - 1)
      uvs[idx * 2] = u
      uvs[idx * 2 + 1] = 0 // 顶部

      uvs[(idx + 1) * 2] = u
      uvs[(idx + 1) * 2 + 1] = 1 // 底部

      // Alpha（随年龄衰减）
      alphas[idx] = age
      alphas[idx + 1] = age

      // 构建三角形索引
      if (i < smoothedPoints.length - 1) {
        const nextIdx = (i + 1) * 2
        // 两个三角形组成一个矩形
        indices.push(idx, idx + 1, nextIdx)
        indices.push(idx + 1, nextIdx + 1, nextIdx)
      }
    })

    // 更新几何体
    if (!geometryRef.current) {
      geometryRef.current = new THREE.BufferGeometry()
    }

    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometryRef.current.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    geometryRef.current.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometryRef.current.setIndex(indices)
    geometryRef.current.computeBoundingSphere()
  }

  useFrame((_, delta) => {
    const startTime = performance.now()

    // 添加新的轨迹点（如果鼠标移动了足够的距离）
    const distanceThreshold = 0.08 // 距离阈值略大，避免点太密集
    if (mouseWorldPos.current.distanceTo(lastAddedPos.current) > distanceThreshold) {
      trailPoints.current.push({
        pos: mouseWorldPos.current.clone(),
        age: 1.0
      })
      lastAddedPos.current.copy(mouseWorldPos.current)

      // 限制最大点数
      if (trailPoints.current.length > maxPoints) {
        trailPoints.current.shift()
      }
    }

    // 更新所有点的年龄并移除过期的点
    const fadeSpeed = 0.6 // 淡出速度略慢，让墨迹保留更久
    trailPoints.current = trailPoints.current
      .map(point => ({
        ...point,
        age: point.age - delta * fadeSpeed
      }))
      .filter(point => point.age > 0)

    // 更新几何体
    updateTrailGeometry(trailPoints.current)

    if (geometryRef.current && meshRef.current) {
      meshRef.current.geometry = geometryRef.current
    }

    // 更新 shader 时间
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta
    }

    // 性能监控
    setRenderTime(performance.now() - startTime)
    setParticleCount(trailPoints.current.length)
    setDrawCalls(gl.info.render.calls)
    setFps(1 / delta)
  })

  return (
    <mesh ref={meshRef}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          color: { value: new THREE.Color(0x1a1a2e) },
          time: { value: 0 }
        }}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function InkTrailRibbonPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="w-full h-screen bg-[#f5f5dc] overflow-hidden">
      <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
        <InkTrailRibbon />
      </Canvas>
    </div>
  )
}
