'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useMissionControl } from '@/store'
import { OfficeScene } from './office-scene'
import { getDepartmentForRole } from './departments'
import type { PixelAgent, SpriteState } from './types'

/** Map tool names from Claude Code hooks to sprite animation states */
function mapToolToState(toolName: string): SpriteState {
  const tool = toolName.toLowerCase()
  if (tool.includes('write') || tool.includes('edit') || tool.includes('notebookedit')) return 'writing'
  if (tool.includes('read') || tool.includes('grep') || tool.includes('glob') || tool.includes('search')) return 'researching'
  if (tool.includes('bash') || tool.includes('exec') || tool.includes('agent')) return 'executing'
  return 'writing' // default for unknown tools
}

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
  const hookEvents = useMissionControl((s) => s.claudeHookEvents)

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

  // Build a map of agent name -> latest hook state
  const hookStateMap = useMemo(() => {
    const map = new Map<string, SpriteState>()
    const now = Date.now()
    // Only consider events from last 60 seconds
    for (const evt of hookEvents) {
      if (now - evt.timestamp > 60000) continue
      const name = evt.agent_name || ''
      if (!name) continue

      if (evt.event_type === 'tool_use' && evt.tool_name) {
        map.set(name, mapToolToState(evt.tool_name))
      } else if (evt.event_type === 'session_start') {
        map.set(name, 'executing')
      } else if (evt.event_type === 'session_end' || evt.event_type === 'stop') {
        map.set(name, 'idle')
      }
    }
    return map
  }, [hookEvents])

  useEffect(() => {
    if (!sceneRef.current) return

    const pixelAgents: PixelAgent[] = agents.map((a) => ({
      id: a.id,
      name: a.name,
      department: getDepartmentForRole(a.role),
      // Hook events override base agent status for more granular animations
      state: hookStateMap.get(a.name) ?? mapAgentStatus(a.status),
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    }))

    sceneRef.current.updateAgents(pixelAgents)
  }, [agents, hookStateMap])

  return (
    <div className="relative w-full h-full min-h-[600px] bg-[#0D1117] rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Status legend */}
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
      {/* Hook event count */}
      {hookEvents.length > 0 && (
        <div className="absolute top-4 right-4 text-xs text-white/40 font-mono">
          {hookEvents.length} hook events
        </div>
      )}
    </div>
  )
}
