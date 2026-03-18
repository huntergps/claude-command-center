import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { eventBus } from '@/lib/event-bus'
import { logger } from '@/lib/logger'

/**
 * POST /api/claude/hook/stop — Receive Stop hook events from Claude Code
 *
 * Expected payload:
 *   { session_id, agent_name?, reason?, timestamp? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const db = getDatabase()

    db.prepare(`
      INSERT INTO claude_hook_events (session_id, event_type, tool_name, agent_name, payload, created_at)
      VALUES (?, 'stop', '', ?, ?, ?)
    `).run(
      body.session_id || 'unknown',
      body.agent_name || '',
      JSON.stringify(body),
      body.timestamp || Math.floor(Date.now() / 1000)
    )

    eventBus.broadcast('claude.hook', {
      type: 'stop',
      session_id: body.session_id,
      agent: body.agent_name,
      reason: body.reason,
    })

    // Mark agent as idle on stop
    if (body.agent_name) {
      eventBus.broadcast('agent.status_changed', {
        name: body.agent_name,
        status: 'idle',
        last_activity: `Stopped: ${body.reason || 'unknown'}`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'POST /api/claude/hook/stop error')
    return NextResponse.json({ error: 'Failed to process hook' }, { status: 500 })
  }
}
