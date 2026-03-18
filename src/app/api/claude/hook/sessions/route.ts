import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { logger } from '@/lib/logger'

/**
 * GET /api/claude/hook/sessions — Return current Claude Code hook sessions/states
 *
 * Returns recent hook events grouped by session so the pixel office can
 * determine which sessions are active and what each is doing.
 *
 * Query params:
 *   hours=1  — lookback window in hours (default 1, max 24)
 */
export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'viewer')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const db = getDatabase()
    const { searchParams } = new URL(request.url)
    const hours = Math.min(parseInt(searchParams.get('hours') || '1'), 24)
    const since = Math.floor(Date.now() / 1000) - hours * 3600

    const sessions = db.prepare(`
      SELECT
        session_id,
        MAX(created_at) as last_activity,
        GROUP_CONCAT(DISTINCT tool_name) as tools_used,
        (SELECT event_type FROM claude_hook_events e2
         WHERE e2.session_id = claude_hook_events.session_id
         ORDER BY created_at DESC LIMIT 1) as last_event_type,
        (SELECT tool_name FROM claude_hook_events e3
         WHERE e3.session_id = claude_hook_events.session_id
         ORDER BY created_at DESC LIMIT 1) as last_tool,
        (SELECT agent_name FROM claude_hook_events e4
         WHERE e4.session_id = claude_hook_events.session_id AND e4.agent_name != ''
         ORDER BY created_at DESC LIMIT 1) as agent_name,
        COUNT(*) as event_count
      FROM claude_hook_events
      WHERE created_at > ?
      GROUP BY session_id
      ORDER BY last_activity DESC
    `).all(since)

    return NextResponse.json({ sessions })
  } catch (err) {
    logger.error({ err }, 'GET /api/claude/hook/sessions error')
    return NextResponse.json({ error: 'Failed to fetch hook sessions' }, { status: 500 })
  }
}
