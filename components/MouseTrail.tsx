'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePerformanceStore } from '@/lib/store'

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
}

function MouseTrailParticles() {
  const { camera, gl } = useThree()
  const particlesRef = useRef<Particle[]>([])
  const meshRef = useRef<THREE.Points>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const lastTimeRef = useRef(0)
  const frameCountRef = useRef(0)
  const lastFpsUpdateRef = useRef(0)

  const { setFps, setRenderTime, setParticleCount, setDrawCalls, setMemoryUsage } =
    usePerformanceStore()

  // 初始化粒子系统
  useEffect(() => {
    const maxParticles = 1000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(maxParticles * 3)
    const colors = new Float32Array(maxParticles * 3)
    const sizes = new Float32Array(maxParticles)

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return () => {
      geometry.dispose()
    }
  }, [])

  // 监听鼠标移动
  useEffect(() => {
    console.log('-------')
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      }

      // 创建新粒子
      const vector = new THREE.Vector3(
        mouseRef.current.x,
        mouseRef.current.y,
        0
      )
      vector.unproject(camera)

      const dir = vector.sub(camera.position).normalize()
      const distance = -camera.position.z / dir.z
      const pos = camera.position.clone().add(dir.multiplyScalar(distance))

      // 每次鼠标移动创建多个粒子
      for (let i = 0; i < 3; i++) {
        const particle: Particle = {
          position: pos.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.2,
              (Math.random() - 0.5) * 0.2,
              0
            )
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05,
            0
          ),
          life: 1,
          maxLife: 1,
          size: Math.random() * 20 + 10,
        }
        particlesRef.current.push(particle)
        console.log('Created particle at', particle.position, 'with velocity', particle.velocity)
      }

      // 限制粒子数量
      if (particlesRef.current.length > 1000) {
        particlesRef.current = particlesRef.current.slice(-1000)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera])

  useFrame(() => {
    console.log('-=====Frame update, particle count:', particlesRef.current.length)
    if (!meshRef.current) return

    const startTime = performance.now()

    // 更新粒子
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.life -= 0.016
      particle.position.add(particle.velocity)
      particle.velocity.multiplyScalar(0.98)
      return particle.life > 0
    })

    // 更新几何体
    const geometry = meshRef.current.geometry
    const positions = geometry.attributes.position.array as Float32Array
    const colors = geometry.attributes.color.array as Float32Array
    const sizes = geometry.attributes.size.array as Float32Array

    particlesRef.current.forEach((particle, i) => {
      const i3 = i * 3
      positions[i3] = particle.position.x
      positions[i3 + 1] = particle.position.y
      positions[i3 + 2] = particle.position.z

      const life = particle.life / particle.maxLife
      colors[i3] = 0.3 + life * 0.7 // R
      colors[i3 + 1] = 0.5 + life * 0.5 // G
      colors[i3 + 2] = 1 // B

      sizes[i] = particle.size * life
    })

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    geometry.attributes.size.needsUpdate = true
    geometry.setDrawRange(0, particlesRef.current.length)

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
    setParticleCount(particlesRef.current.length)
    setDrawCalls(gl.info.render.calls)
    
    if (performance.memory) {
      setMemoryUsage(performance.memory.usedJSHeapSize / 1048576)
    }

    lastTimeRef.current = now
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={new Float32Array(1000 * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={1000}
          array={new Float32Array(1000 * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={1000}
          array={new Float32Array(1000)}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function MouseTrail() {
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
      <MouseTrailParticles />
    </Canvas>
  )
}
