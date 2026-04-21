import { create } from 'zustand'

interface PerformanceState {
  fps: number
  renderTime: number
  particleCount: number
  drawCalls: number
  memoryUsage: number
  setFps: (fps: number) => void
  setRenderTime: (time: number) => void
  setParticleCount: (count: number) => void
  setDrawCalls: (calls: number) => void
  setMemoryUsage: (usage: number) => void
}

export const usePerformanceStore = create<PerformanceState>(set => ({
  fps: 60,
  renderTime: 0,
  particleCount: 0,
  drawCalls: 0,
  memoryUsage: 0,
  setFps: fps => set({ fps }),
  setRenderTime: renderTime => set({ renderTime }),
  setParticleCount: particleCount => set({ particleCount }),
  setDrawCalls: drawCalls => set({ drawCalls }),
  setMemoryUsage: memoryUsage => set({ memoryUsage }),
}))
