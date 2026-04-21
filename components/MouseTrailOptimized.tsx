'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePerformanceStore } from '@/lib/store'

interface ParticleData {
  active: boolean
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  index: number
}

// 对象池类
class ParticlePool {
  private pool: ParticleData[] = []
  private activeParticles: ParticleData[] = []
  private maxSize: number

  constructor(maxSize: number) {
    this.maxSize = maxSize
    // 预先创建粒子对象
    for (let i = 0; i < maxSize; i++) {
      this.pool.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        size: 0,
        index: i,
      })
    }
  }

  get(position: THREE.Vector3, velocity: THREE.Vector3, size: number): ParticleData | null {
    let particle: ParticleData | undefined

    // 从池中获取非活动粒子
    particle = this.pool.find(p => !p.active)

    if (particle) {
      particle.active = true
      particle.position.copy(position)
      particle.velocity.copy(velocity)
      particle.life = 1
      particle.maxLife = 1
      particle.size = size
      this.activeParticles.push(particle)
      return particle
    }

    return null
  }

  release(particle: ParticleData) {
    particle.active = false
    const index = this.activeParticles.indexOf(particle)
    if (index > -1) {
      this.activeParticles.splice(index, 1)
    }
  }

  getActiveParticles(): ParticleData[] {
    return this.activeParticles
  }

  getActiveCount(): number {
    return this.activeParticles.length
  }
}

function MouseTrailParticlesOptimized() {
  const { camera, gl } = useThree()
  const particlePoolRef = useRef<ParticlePool>(new ParticlePool(500))
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const lastMouseMoveRef = useRef(0)
  const frameCountRef = useRef(0)
  const lastFpsUpdateRef = useRef(0)

  const { setFps, setRenderTime, setParticleCount, setDrawCalls, setMemoryUsage } =
    usePerformanceStore()

  const dummyObject = useRef(new THREE.Object3D())
  const colorArray = useRef<Float32Array>()

  // 初始化实例化网格
  useEffect(() => {
    if (!meshRef.current) return

    const mesh = meshRef.current
    colorArray.current = new Float32Array(500 * 3)

    // 设置初始颜色
    for (let i = 0; i < 500; i++) {
      mesh.setColorAt(i, new THREE.Color(0x4488ff))
    }

    // 初始化所有实例为不可见
    for (let i = 0; i < 500; i++) {
      dummyObject.current.position.set(0, 0, -1000)
      dummyObject.current.scale.set(0, 0, 0)
      dummyObject.current.updateMatrix()
      mesh.setMatrixAt(i, dummyObject.current.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  }, [])

  // 优化的鼠标移动监听（节流）
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const now = performance.now()
      
      // 节流：每16ms（约60fps）处理一次
      if (now - lastMouseMoveRef.current < 16) return
      
      lastMouseMoveRef.current = now

      mouseRef.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      }

      const vector = new THREE.Vector3(
        mouseRef.current.x,
        mouseRef.current.y,
        0
      )
      vector.unproject(camera)

      const dir = vector.sub(camera.position).normalize()
      const distance = -camera.position.z / dir.z
      const pos = camera.position.clone().add(dir.multiplyScalar(distance))

      console.log('Mouse move at:', pos, 'Active particles:', particlePoolRef.current.getActiveCount())

      // 每次创建2个粒子（比基础版少）
      for (let i = 0; i < 2; i++) {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          0
        )
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          0
        )
        
        const particle = particlePoolRef.current.get(
          pos.clone().add(offset),
          velocity,
          Math.random() * 2 + 1
        )
        console.log('Created particle:', particle)
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera])

  useFrame(() => {
    if (!meshRef.current) return

    const startTime = performance.now()
    const mesh = meshRef.current
    const particles = particlePoolRef.current.getActiveParticles()

    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]
      particle.life -= 0.016
      particle.position.add(particle.velocity)
      particle.velocity.multiplyScalar(0.98)

      if (particle.life <= 0) {
        // 释放粒子回池中
        particlePoolRef.current.release(particle)
        
        // 隐藏实例
        dummyObject.current.position.set(0, 0, -1000)
        dummyObject.current.scale.set(0, 0, 0)
        dummyObject.current.updateMatrix()
        mesh.setMatrixAt(particle.index, dummyObject.current.matrix)
      } else {
        // 更新实例
        const life = particle.life / particle.maxLife
        dummyObject.current.position.copy(particle.position)
        dummyObject.current.scale.setScalar(particle.size * life)
        dummyObject.current.updateMatrix()
        mesh.setMatrixAt(particle.index, dummyObject.current.matrix)

        // 更新颜色
        const color = new THREE.Color()
        color.setHSL(0.6 + life * 0.2, 1, 0.5 + life * 0.3)
        mesh.setColorAt(particle.index, color)
      }
    }
    // particles.forEach(particle => {
    //   particle.life -= 0.016
    //   particle.position.add(particle.velocity)
    //   particle.velocity.multiplyScalar(0.98)

    //   if (particle.life <= 0) {
    //     // 释放粒子回池中
    //     particlePoolRef.current.release(particle)
        
    //     // 隐藏实例
    //     dummyObject.current.position.set(0, 0, -1000)
    //     dummyObject.current.scale.set(0, 0, 0)
    //     dummyObject.current.updateMatrix()
    //     mesh.setMatrixAt(particle.index, dummyObject.current.matrix)
    //   } else {
    //     // 更新实例
    //     const life = particle.life / particle.maxLife
    //     dummyObject.current.position.copy(particle.position)
    //     dummyObject.current.scale.setScalar(particle.size * life)
    //     dummyObject.current.updateMatrix()
    //     mesh.setMatrixAt(particle.index, dummyObject.current.matrix)

    //     // 更新颜色
    //     const color = new THREE.Color()
    //     color.setHSL(0.6 + life * 0.2, 1, 0.5 + life * 0.3)
    //     mesh.setColorAt(particle.index, color)
    //   }
    // })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }

    const renderTime = performance.now() - startTime

    // 计算 FPS
    frameCountRef.current++
    const now = performance.now()
    if (now - lastFpsUpdateRef.current >= 1000) {
      const fps = (frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)
      setFps(fps)
      frameCountRef.current = 0
      lastFpsUpdateRef.current = now
    }

    // 更新性能指标
    setRenderTime(renderTime)
    setParticleCount(particlePoolRef.current.getActiveCount())
    setDrawCalls(gl.info.render.calls)
    
    if (performance.memory) {
      setMemoryUsage(performance.memory.usedJSHeapSize / 1048576)
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 500]}>
      <circleGeometry args={[0.15, 16]} />
      <meshBasicMaterial
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

export default function MouseTrailOptimized() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#000000']} />
      <MouseTrailParticlesOptimized />
    </Canvas>
  )
}
