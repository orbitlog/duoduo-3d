'use client'

import { create } from 'zustand'

interface PerformanceMetrics {
  fps: number
  renderTime: number
  particleCount: number
  drawCalls: number
  memoryUsage: number
}

interface CompareState {
  basic: PerformanceMetrics
  optimized: PerformanceMetrics
  updateBasic: (metrics: Partial<PerformanceMetrics>) => void
  updateOptimized: (metrics: Partial<PerformanceMetrics>) => void
}

export const useCompareStore = create<CompareState>(set => ({
  basic: {
    fps: 60,
    renderTime: 0,
    particleCount: 0,
    drawCalls: 0,
    memoryUsage: 0,
  },
  optimized: {
    fps: 60,
    renderTime: 0,
    particleCount: 0,
    drawCalls: 0,
    memoryUsage: 0,
  },
  updateBasic: metrics =>
    set(state => ({
      basic: { ...state.basic, ...metrics },
    })),
  updateOptimized: metrics =>
    set(state => ({
      optimized: { ...state.optimized, ...metrics },
    })),
}))
