import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { eventBus } from '@/lib/event-bus'
import { logger } from '@/lib/logger'

/**
 * POST /api/claude/hook/session-start — Receive SessionStart hook events from Claude Code
 *
 * Expected payload:
 *   { session_id, agent_name?, project?, cwd?, timestamp? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const db = getDatabase()

    db.prepare(`
      INSERT INTO claude_hook_events (session_id, event_type, tool_name, agent_name, payload, created_at)
      VALUES (?, 'session_start', '', ?, ?, ?)
    `).run(
      body.session_id || 'unknown',
      body.agent_name || '',
      JSON.stringify(body),
      body.timestamp || Math.floor(Date.now() / 1000)
    )

    eventBus.broadcast('claude.hook', {
      type: 'session_start',
      session_id: body.session_id,
      agent: body.agent_name,
      project: body.project,
    })

    // Mark agent as busy if we know the agent name
    if (body.agent_name) {
      eventBus.broadcast('agent.status_changed', {
        name: body.agent_name,
        status: 'busy',
        last_activity: 'Session started',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'POST /api/claude/hook/session-start error')
    return NextResponse.json({ error: 'Failed to process hook' }, { status: 500 })
  }
}
