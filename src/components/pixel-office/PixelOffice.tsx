'use client'

import { useRef, useEffect } from 'react'
import { useMissionControl } from '@/store'
import { OfficeScene } from './office-scene'
import { getDepartmentForRole } from './departments'
import type { PixelAgent, SpriteState } from './types'

function mapAgentStatus(status: string): SpriteState {
  switch (status) {
    case 'busy':
      return 'writing'
    case 'error':
      return 'error'
    case 'offline':
      return 'waiting'
    default:
      return 'idle'
  }
}

export function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<OfficeScene | null>(null)
  const agents = useMissionControl((s) => s.agents)

  useEffect(() => {
    const scene = new OfficeScene()
    sceneRef.current = scene

    if (canvasRef.current) {
      scene.init(canvasRef.current)
    }

    return () => {
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!sceneRef.current) return

    const pixelAgents: PixelAgent[] = agents.map((a) => ({
      id: a.id,
      name: a.name,
      department: getDepartmentForRole(a.role),
      state: mapAgentStatus(a.status),
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    }))

    sceneRef.current.updateAgents(pixelAgents)
  }, [agents])

  return (
    <div className="relative w-full h-full min-h-[600px] bg-[#0D1117] rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-4 left-4 flex gap-3 text-xs text-white/60">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" /> Idle
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Writing
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-violet-400" /> Research
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" /> Executing
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400" /> Error
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-400" /> Waiting
        </span>
      </div>
    </div>
  )
}
