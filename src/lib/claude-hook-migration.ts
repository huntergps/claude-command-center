import type Database from 'better-sqlite3'
import type { Migration } from './migrations'

/**
 * Migration to create the claude_hook_events table for storing
 * webhook events from Claude Code hooks (PostToolUse, SessionStart, SessionEnd, Stop).
 */
export const claudeHookMigration: Migration = {
  id: '042_claude_hook_events',
  up(db: Database.Database) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS claude_hook_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('session_start', 'session_end', 'tool_use', 'stop')),
        tool_name TEXT DEFAULT '',
        agent_name TEXT DEFAULT '',
        payload TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL
      )
    `)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_claude_hook_session ON claude_hook_events(session_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_claude_hook_created ON claude_hook_events(created_at)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_claude_hook_event_type ON claude_hook_events(event_type)`)
  }
}
