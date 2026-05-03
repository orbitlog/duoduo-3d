'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePerformanceStore } from '@/lib/store'

function StarParticles() {
  const count = 500
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const { camera, gl } = useThree()
  const { setFps, setRenderTime, setParticleCount, setDrawCalls } = usePerformanceStore()

  // 1. 星星几何体（你坚持的 ShapeGeometry）
  const starGeo = useMemo(() => {
    const shape = new THREE.Shape()
    const spikes = 5
    const outer = 0.8, inner = 0.35
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
      shape[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r)
    }
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [])

  // 2. 核心状态：坐标与移动检测
  const mouseWorldPos = useRef(new THREE.Vector3())
  const prevMouseWorldPos = useRef(new THREE.Vector3())
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
      
      // 检测位置是否真的变化了（避免微小抖动）
      if (newPos.distanceTo(mouseWorldPos.current) > 0.01) {
        prevMouseWorldPos.current.copy(mouseWorldPos.current)
        mouseWorldPos.current.copy(newPos)
        hasMouseMoved.current = true
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera])

  // 3. 对象池数据
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    active: false,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    rot: 0,
    rotVel: (Math.random() - 0.5) * 0.2,
    life: 0,
  })), [])

  useFrame((_, delta) => {
    const startTime = performance.now()

    // --- 只在鼠标真正移动时生成星星 ---
    let spawned = 0
    if (hasMouseMoved.current) {
      for (let i = 0; i < count && spawned < 2; i++) {
        const p = particles[i]
        if (!p.active) {
          p.active = true
          p.life = 1.0
          p.pos.copy(mouseWorldPos.current)
          p.vel.set((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12, 0)
          spawned++
        }
      }
      hasMouseMoved.current = false // 用完后重置，等待下次移动
    }

    let activeCount = 0
    particles.forEach((p, i) => {
      if (p.active) {
        p.life -= delta * 0.8
        p.pos.add(p.vel)
        p.rot += p.rotVel
        activeCount++

        if (p.life <= 0) {
          p.active = false
          dummy.scale.setScalar(0)
        } else {
          dummy.position.copy(p.pos)
          dummy.rotation.z = p.rot
          dummy.scale.setScalar(p.life)
        }
      } else {
        dummy.scale.setScalar(0)
      }
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true

    // 更新监控数据
    setRenderTime(performance.now() - startTime)
    setParticleCount(activeCount)
    setDrawCalls(gl.info.render.calls)
    setFps(1 / delta)
  })

  return (
    <instancedMesh ref={meshRef} args={[starGeo, undefined, count]}>
      <meshBasicMaterial color="#FFD700" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  )
}

export default function StarPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
        <StarParticles />
      </Canvas>
    </div>
  )
}
