import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { eventBus } from '@/lib/event-bus'
import { logger } from '@/lib/logger'

/**
 * POST /api/claude/hook/tool — Receive PostToolUse hook events from Claude Code
 *
 * Expected payload:
 *   { session_id, tool_name, tool_input, result, agent_name?, timestamp? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const db = getDatabase()

    db.prepare(`
      INSERT INTO claude_hook_events (session_id, event_type, tool_name, agent_name, payload, created_at)
      VALUES (?, 'tool_use', ?, ?, ?, ?)
    `).run(
      body.session_id || 'unknown',
      body.tool_name || '',
      body.agent_name || '',
      JSON.stringify(body),
      body.timestamp || Math.floor(Date.now() / 1000)
    )

    eventBus.broadcast('claude.hook', {
      type: 'tool_use',
      tool: body.tool_name,
      session_id: body.session_id,
      agent: body.agent_name,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'POST /api/claude/hook/tool error')
    return NextResponse.json({ error: 'Failed to process hook' }, { status: 500 })
  }
}
