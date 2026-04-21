'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useCompareStore } from '@/lib/compareStore'

interface ParticleData {
  active: boolean
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  index: number
}

class ParticlePool {
  private pool: ParticleData[] = []
  private activeParticles: ParticleData[] = []
  private maxSize: number

  constructor(maxSize: number) {
    this.maxSize = maxSize
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

  get(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    size: number
  ): ParticleData | null {
    const particle = this.pool.find(p => !p.active)

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

  const updateOptimized = useCompareStore(state => state.updateOptimized)
  const dummyObject = useRef(new THREE.Object3D())

  useEffect(() => {
    if (!meshRef.current) return

    const mesh = meshRef.current

    for (let i = 0; i < 500; i++) {
      mesh.setColorAt(i, new THREE.Color(0x8844ff))
    }

    for (let i = 0; i < 500; i++) {
      dummyObject.current.position.set(0, 0, -1000)
      dummyObject.current.scale.set(0, 0, 0)
      dummyObject.current.updateMatrix()
      mesh.setMatrixAt(i, dummyObject.current.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  }, [])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect()

      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return
      }

      const now = performance.now()
      if (now - lastMouseMoveRef.current < 16) return
      lastMouseMoveRef.current = now

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

        particlePoolRef.current.get(
          pos.clone().add(offset),
          velocity,
          Math.random() * 0.3 + 0.2
        )
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera, gl])

  useFrame(() => {
    if (!meshRef.current) return

    const startTime = performance.now()
    const mesh = meshRef.current
    const particles = particlePoolRef.current.getActiveParticles()

    particles.forEach(particle => {
      particle.life -= 0.016
      particle.position.add(particle.velocity)
      particle.velocity.multiplyScalar(0.98)

      if (particle.life <= 0) {
        particlePoolRef.current.release(particle)

        dummyObject.current.position.set(0, 0, -1000)
        dummyObject.current.scale.set(0, 0, 0)
        dummyObject.current.updateMatrix()
        mesh.setMatrixAt(particle.index, dummyObject.current.matrix)
      } else {
        const life = particle.life / particle.maxLife
        dummyObject.current.position.copy(particle.position)
        dummyObject.current.scale.setScalar(particle.size * life)
        dummyObject.current.updateMatrix()
        mesh.setMatrixAt(particle.index, dummyObject.current.matrix)

        const color = new THREE.Color()
        color.setHSL(0.7 + life * 0.2, 1, 0.5 + life * 0.3)
        mesh.setColorAt(particle.index, color)
      }
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }

    const renderTime = performance.now() - startTime

    frameCountRef.current++
    const now = performance.now()
    if (now - lastFpsUpdateRef.current >= 1000) {
      const fps =
        (frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)
      updateOptimized({ fps })
      frameCountRef.current = 0
      lastFpsUpdateRef.current = now
    }

    updateOptimized({
      renderTime,
      particleCount: particlePoolRef.current.getActiveCount(),
      drawCalls: gl.info.render.calls,
      memoryUsage: performance.memory
        ? performance.memory.usedJSHeapSize / 1048576
        : 0,
    })
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 500]}>
      <circleGeometry args={[1, 16]} />
      <meshBasicMaterial
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

export default function MouseTrailOptimizedCompare() {
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
