'use client'

import { useState, useEffect } from 'react'
import type { DashboardData } from './widget-primitives'

function useClockTick() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function getInitials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function ClawEmpireHeader({ data }: { data: DashboardData }) {
  const now = useClockTick()

  const totalTasks = data.dbStats?.tasks.total ?? data.tasks.length
  const doneTasks = data.doneCount
  const clearRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const doneProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const inProgressCount = data.runningTasks + data.activeSessions

  // Agent ranking: sort by done/completed tasks
  const rankedAgents = [...data.agents]
    .map((a) => ({
      id: a.id,
      name: a.name ?? a.id,
      status: a.status ?? 'offline',
      done: a.taskStats?.done ?? a.taskStats?.completed ?? 0,
    }))
    .sort((a, b) => b.done - a.done)
    .slice(0, 5)

  const statusColorMap: Record<string, string> = {
    idle: 'bg-green-400',
    busy: 'bg-amber-400',
    error: 'bg-red-400',
    offline: 'bg-zinc-600',
  }

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false })

  return (
    <section className="space-y-3">
      {/* Command Center Header */}
      <div
        className="relative rounded-xl border border-cyan-500/20 bg-card/60 backdrop-blur p-4 overflow-hidden"
        style={{
          boxShadow: '0 0 20px rgba(34,211,238,0.05), inset 0 1px 0 rgba(34,211,238,0.1)',
        }}
      >
        {/* Scanline overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.1) 2px, rgba(34,211,238,0.1) 4px)',
          }}
        />

        <div className="relative flex items-center justify-between">
          <div>
            <h2
              className="font-mono text-lg font-bold uppercase tracking-[0.2em] text-cyan-400"
              style={{ textShadow: '0 0 12px rgba(34,211,238,0.5), 0 0 24px rgba(34,211,238,0.2)' }}
            >
              COMMAND CENTER
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-xs text-muted-foreground tracking-wide">
                {dateStr}
              </span>
              <span
                className="font-mono text-xs text-cyan-400/80 tabular-nums"
                style={{ textShadow: '0 0 6px rgba(34,211,238,0.3)' }}
              >
                {timeStr}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                data.connection.isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}
              style={{
                boxShadow: data.connection.isConnected
                  ? '0 0 6px rgba(74,222,128,0.6), 0 0 12px rgba(74,222,128,0.3)'
                  : '0 0 6px rgba(248,113,113,0.6)',
                animation: data.connection.isConnected
                  ? 'claw-pulse 2s ease-in-out infinite'
                  : 'none',
              }}
            />
            <span className="font-mono text-2xs uppercase tracking-widest text-muted-foreground">
              {data.connection.isConnected ? 'LINKED' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: MISSIONS */}
        <div
          className="relative rounded-xl border border-cyan-500/20 bg-card/50 backdrop-blur p-4 overflow-hidden group"
          style={{
            boxShadow: '0 0 15px rgba(34,211,238,0.04), inset 0 1px 0 rgba(34,211,238,0.08)',
          }}
        >
          <div className="relative">
            <div className="font-mono text-2xs uppercase tracking-[0.15em] text-cyan-400/70 mb-2">
              MISSIONS
            </div>
            <div
              className="font-mono text-3xl font-bold text-cyan-400 tabular-nums"
              style={{ textShadow: '0 0 10px rgba(34,211,238,0.4)' }}
            >
              {totalTasks}
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-700"
                style={{ width: `${doneProgress}%` }}
              />
            </div>
            <div className="font-mono text-2xs text-muted-foreground mt-1">
              {doneTasks} / {totalTasks} done
            </div>
          </div>
        </div>

        {/* Card 2: CLEAR RATE */}
        <div
          className="relative rounded-xl border border-green-500/20 bg-card/50 backdrop-blur p-4 overflow-hidden group"
          style={{
            boxShadow: '0 0 15px rgba(74,222,128,0.04), inset 0 1px 0 rgba(74,222,128,0.08)',
          }}
        >
          <div className="relative">
            <div className="font-mono text-2xs uppercase tracking-[0.15em] text-green-400/70 mb-2">
              CLEAR RATE
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="font-mono text-3xl font-bold text-green-400 tabular-nums"
                style={{ textShadow: '0 0 10px rgba(74,222,128,0.4)' }}
              >
                {clearRate}
              </span>
              <span
                className="font-mono text-lg font-bold text-green-400/60"
                style={{ textShadow: '0 0 8px rgba(74,222,128,0.2)' }}
              >
                %
              </span>
            </div>
            <div className="font-mono text-2xs text-muted-foreground mt-1">
              completion ratio
            </div>
          </div>
        </div>

        {/* Card 3: SQUAD */}
        <div
          className="relative rounded-xl border border-violet-500/20 bg-card/50 backdrop-blur p-4 overflow-hidden group"
          style={{
            boxShadow: '0 0 15px rgba(129,140,248,0.04), inset 0 1px 0 rgba(129,140,248,0.08)',
          }}
        >
          <div className="relative">
            <div className="font-mono text-2xs uppercase tracking-[0.15em] text-violet-400/70 mb-2">
              SQUAD
            </div>
            <div
              className="font-mono text-3xl font-bold text-violet-400 tabular-nums"
              style={{ textShadow: '0 0 10px rgba(129,140,248,0.4)' }}
            >
              {data.onlineAgents}
            </div>
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {data.agents.slice(0, 12).map((agent) => (
                <div
                  key={agent.id}
                  className={`w-2 h-2 rounded-full ${statusColorMap[agent.status] ?? 'bg-zinc-600'}`}
                  title={`${agent.name ?? agent.id}: ${agent.status}`}
                  style={{
                    boxShadow:
                      agent.status === 'idle'
                        ? '0 0 4px rgba(74,222,128,0.4)'
                        : agent.status === 'busy'
                          ? '0 0 4px rgba(251,191,36,0.4)'
                          : agent.status === 'error'
                            ? '0 0 4px rgba(248,113,113,0.4)'
                            : 'none',
                  }}
                />
              ))}
            </div>
            <div className="font-mono text-2xs text-muted-foreground mt-1">
              online agents
            </div>
          </div>
        </div>

        {/* Card 4: IN PROGRESS */}
        <div
          className="relative rounded-xl border border-amber-500/20 bg-card/50 backdrop-blur p-4 overflow-hidden group"
          style={{
            boxShadow: '0 0 15px rgba(251,191,36,0.04), inset 0 1px 0 rgba(251,191,36,0.08)',
          }}
        >
          <div className="relative">
            <div className="font-mono text-2xs uppercase tracking-[0.15em] text-amber-400/70 mb-2">
              IN PROGRESS
            </div>
            <div
              className="font-mono text-3xl font-bold text-amber-400 tabular-nums"
              style={{
                textShadow: '0 0 10px rgba(251,191,36,0.4)',
                animation: inProgressCount > 0 ? 'claw-num-pulse 2s ease-in-out infinite' : 'none',
              }}
            >
              {inProgressCount}
            </div>
            <div className="font-mono text-2xs text-muted-foreground mt-1">
              {data.runningTasks} tasks + {data.activeSessions} sessions
            </div>
          </div>
        </div>
      </div>

      {/* Agent Ranking Board */}
      {rankedAgents.length > 0 && (
        <div
          className="relative rounded-xl border border-cyan-500/10 bg-card/40 backdrop-blur p-3 overflow-hidden"
          style={{
            boxShadow: '0 0 12px rgba(34,211,238,0.03)',
            animation: 'claw-border-glow 4s ease-in-out infinite',
          }}
        >
          <div className="font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground mb-2">
            TOP OPERATORS
          </div>
          <div className="flex items-center gap-4 overflow-x-auto">
            {rankedAgents.map((agent, idx) => {
              const rankColors = [
                'text-amber-400',
                'text-zinc-300',
                'text-amber-600',
                'text-muted-foreground',
                'text-muted-foreground',
              ]
              return (
                <div key={agent.id} className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-xs font-bold tabular-nums ${rankColors[idx] ?? 'text-muted-foreground'}`}
                  >
                    #{idx + 1}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-2xs font-bold font-mono ${
                      agent.status === 'idle'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : agent.status === 'busy'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : agent.status === 'error'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30'
                    }`}
                  >
                    {getInitials(agent.name)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-foreground/80 truncate max-w-[100px]">
                      {agent.name}
                    </span>
                    <span className="font-mono text-2xs text-cyan-400/60 tabular-nums">
                      {agent.done} done
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes claw-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes claw-num-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.02); }
        }
        @keyframes claw-border-glow {
          0%, 100% { border-color: rgba(34,211,238,0.1); }
          50% { border-color: rgba(34,211,238,0.2); }
        }
      `}</style>
    </section>
  )
}
