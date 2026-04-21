'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useCompareStore } from '@/lib/compareStore'

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
}

function MouseTrailParticlesBasic() {
  const { camera, gl } = useThree()
  const particlesRef = useRef<Particle[]>([])
  const meshRef = useRef<THREE.Points>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const frameCountRef = useRef(0)
  const lastFpsUpdateRef = useRef(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const updateBasic = useCompareStore(state => state.updateBasic)

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

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      
      // 检查鼠标是否在当前 canvas 内
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return
      }

      mouseRef.current = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
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
      }

      if (particlesRef.current.length > 1000) {
        particlesRef.current = particlesRef.current.slice(-1000)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera, gl])

  useFrame(() => {
    if (!meshRef.current) return

    const startTime = performance.now()

    particlesRef.current = particlesRef.current.filter(particle => {
      particle.life -= 0.016
      particle.position.add(particle.velocity)
      particle.velocity.multiplyScalar(0.98)
      return particle.life > 0
    })

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
      colors[i3] = 0.3 + life * 0.7
      colors[i3 + 1] = 0.5 + life * 0.5
      colors[i3 + 2] = 1

      sizes[i] = particle.size * life
    })

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    geometry.attributes.size.needsUpdate = true
    geometry.setDrawRange(0, particlesRef.current.length)

    const renderTime = performance.now() - startTime

    frameCountRef.current++
    const now = performance.now()
    if (now - lastFpsUpdateRef.current >= 1000) {
      const fps =
        (frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)
      updateBasic({ fps })
      frameCountRef.current = 0
      lastFpsUpdateRef.current = now
    }

    updateBasic({
      renderTime,
      particleCount: particlesRef.current.length,
      drawCalls: gl.info.render.calls,
      memoryUsage: performance.memory
        ? performance.memory.usedJSHeapSize / 1048576
        : 0,
    })
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

export default function MouseTrailBasicCompare() {
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
      <MouseTrailParticlesBasic />
    </Canvas>
  )
}
