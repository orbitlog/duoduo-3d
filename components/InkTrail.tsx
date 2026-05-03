'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePerformanceStore } from '@/lib/store'

// ===== GLSL Shader 代码 =====
// Vertex Shader：处理顶点位置
const vertexShader = `
  varying vec2 vUv;
  varying float vLife;
  
  // 接收从 CPU 传来的每个实例的自定义属性
  attribute float life;
  attribute float rotation;
  attribute float size;
  
  void main() {
    vUv = uv;
    vLife = life;
    
    // 应用旋转和缩放
    vec3 pos = position;
    
    // 旋转
    float s = sin(rotation);
    float c = cos(rotation);
    pos.xy = mat2(c, -s, s, c) * pos.xy;
    
    // 缩放（随生命周期扩散）
    pos.xy *= size;
    
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

// Fragment Shader：绘制墨水波纹效果
const fragmentShader = `
  uniform vec3 color;
  uniform float time;
  
  varying vec2 vUv;
  varying float vLife;
  
  // 噪声函数（用于制造不规则边缘）
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  // 简单的2D噪声
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
    // 计算到中心的距离
    vec2 center = vUv - 0.5;
    float dist = length(center);
    
    // 墨水扩散效果：控制在较小范围
    float expandRadius = 1.0 - vLife * 0.85;
    
    // 创建多层波纹（频率更高，幅度更小）
    float wave1 = abs(sin((dist - expandRadius * 0.3) * 25.0)) * 0.3;
    float wave2 = abs(sin((dist - expandRadius * 0.5) * 18.0)) * 0.2;
    float wave3 = abs(sin((dist - expandRadius * 0.7) * 12.0)) * 0.15;
    
    // 添加噪声制造不规则边缘（墨水晕染效果）
    vec2 noiseCoord = vUv * 8.0 + time * 0.1;
    float noiseVal = noise(noiseCoord);
    float edgeNoise = noise(vUv * 15.0 + vec2(time * 0.05));
    
    // 中心到边缘的渐变
    float gradient = 1.0 - smoothstep(0.0, 0.45, dist);
    
    // 墨水的主体形状（带噪声的圆形，更集中）
    float inkShape = smoothstep(0.5 + edgeNoise * 0.08, 0.25, dist);
    
    // 混合波纹效果
    float waves = wave1 + wave2 + wave3;
    float inkEffect = inkShape * (0.8 + waves * 0.2);
    
    // 添加墨水扩散的外圈晕染（范围更小）
    float outerGlow = smoothstep(0.45, 0.15, dist) * (1.0 - smoothstep(0.15, 0.0, dist));
    outerGlow *= noiseVal * 0.3;
    
    // 最终透明度：随生命值衰减
    float alpha = (inkEffect + outerGlow) * vLife * vLife;
    
    // 颜色略微变化（中心深，边缘浅）
    vec3 finalColor = color * (0.6 + gradient * 0.4);
    
    gl_FragColor = vec4(finalColor, alpha);
    
    // 完全透明的像素直接丢弃
    if (alpha < 0.01) discard;
  }
`

function InkParticles() {
  const count = 300
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { camera, gl } = useThree()
  const { setFps, setRenderTime, setParticleCount, setDrawCalls } = usePerformanceStore()

  // 平面几何体（用于渲染墨水）
  const planeGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), [])

  // 鼠标状态
  const mouseWorldPos = useRef(new THREE.Vector3())
  const hasMouseMoved = useRef(false)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1
      const ny = -(event.clientY / window.innerHeight) * 2 + 1
      
      const vec = new THREE.Vector3(nx, ny, 0.5)
      vec.unproject(camera)
      const dir = vec.sub(camera.position).normalize()
      const distance = -camera.position.z / dir.z
      const newPos = new THREE.Vector3().copy(camera.position).add(dir.multiplyScalar(distance))
      
      // 更敏感的距离检测，让拖尾更连贯
      if (newPos.distanceTo(mouseWorldPos.current) > 0.005) {
        mouseWorldPos.current.copy(newPos)
        hasMouseMoved.current = true
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera])

  // 对象池
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    active: false,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 0,
    rotation: Math.random() * Math.PI * 2,
    rotVel: (Math.random() - 0.5) * 0.1,
    size: 0.5 + Math.random() * 1.0, // 不同大小的墨水滴
  })), [count])

  // 为 shader 准备的 attribute 数组
  const lifeArray = useMemo(() => new Float32Array(count), [count])
  const rotationArray = useMemo(() => new Float32Array(count), [count])
  const sizeArray = useMemo(() => new Float32Array(count), [count])

  useEffect(() => {
    if (!meshRef.current) return
    
    // 设置 instance attributes（每个实例的自定义数据）
    meshRef.current.geometry.setAttribute(
      'life',
      new THREE.InstancedBufferAttribute(lifeArray, 1)
    )
    meshRef.current.geometry.setAttribute(
      'rotation',
      new THREE.InstancedBufferAttribute(rotationArray, 1)
    )
    meshRef.current.geometry.setAttribute(
      'size',
      new THREE.InstancedBufferAttribute(sizeArray, 1)
    )
  }, [lifeArray, rotationArray, sizeArray])

  useFrame((_, delta) => {
    const startTime = performance.now()

    // 生成墨水滴
    let spawned = 0
    if (hasMouseMoved.current) {
      // 每次生成 4-6 个墨水滴，让拖尾更连贯
      const spawnCount = 4 + Math.floor(Math.random() * 3)
      for (let i = 0; i < count && spawned < spawnCount; i++) {
        const p = particles[i]
        if (!p.active) {
          p.active = true
          p.life = 1.0
          p.maxLife = 1.0
          p.pos.copy(mouseWorldPos.current)
          // 添加轻微的随机偏移（模拟笔触不完全重合）
          p.pos.x += (Math.random() - 0.5) * 0.1
          p.pos.y += (Math.random() - 0.5) * 0.1
          // 墨水几乎不移动，只在原地扩散
          p.vel.set((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, 0)
          p.rotation = Math.random() * Math.PI * 2
          p.size = 0.6 + Math.random() * 0.4 // 初始大小更小
          spawned++
        }
      }
      hasMouseMoved.current = false
    }

    // 更新粒子
    let activeCount = 0
    particles.forEach((p, i) => {
      if (p.active) {
        // 墨水衰减速度适中
        p.life -= delta * 0.5
        p.pos.add(p.vel)
        p.rotation += p.rotVel
        
        // 墨水扩散：size 随时间轻微增大（不要太夸张）
        const expandFactor = 1.0 + (1.0 - p.life) * 0.6
        
        activeCount++

        if (p.life <= 0) {
          p.active = false
          dummy.scale.setScalar(0)
          lifeArray[i] = 0
        } else {
          dummy.position.copy(p.pos)
          dummy.rotation.z = p.rotation
          dummy.scale.setScalar(p.size * expandFactor)
          dummy.updateMatrix()
          
          // 更新 shader attributes
          lifeArray[i] = p.life
          rotationArray[i] = p.rotation
          sizeArray[i] = p.size * expandFactor
        }
      } else {
        dummy.scale.setScalar(0)
        lifeArray[i] = 0
      }
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    
    // 更新 attributes
    if (meshRef.current.geometry.attributes.life) {
      meshRef.current.geometry.attributes.life.needsUpdate = true
    }
    if (meshRef.current.geometry.attributes.rotation) {
      meshRef.current.geometry.attributes.rotation.needsUpdate = true
    }
    if (meshRef.current.geometry.attributes.size) {
      meshRef.current.geometry.attributes.size.needsUpdate = true
    }

    // 更新 shader 的时间 uniform
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta
    }

    // 更新性能监控
    setRenderTime(performance.now() - startTime)
    setParticleCount(activeCount)
    setDrawCalls(gl.info.render.calls)
    setFps(1 / delta)
  })

  return (
    <instancedMesh ref={meshRef} args={[planeGeo, undefined, count]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          color: { value: new THREE.Color(0x1a1a2e) }, // 墨水深蓝黑色
          time: { value: 0 }
        }}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </instancedMesh>
  )
}

export default function InkTrailPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="w-full h-screen bg-[#f5f5dc] overflow-hidden">
      {/* 仿宣纸背景 */}
      <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
        <InkParticles />
      </Canvas>
    </div>
  )
}
