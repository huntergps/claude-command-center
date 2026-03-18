import type { Department, DepartmentConfig } from './types'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800
const COLS = 3
const ROWS = 2
const GAP = 20
const PADDING = 30

const DEPT_WIDTH = Math.floor((CANVAS_WIDTH - PADDING * 2 - GAP * (COLS - 1)) / COLS)
const DEPT_HEIGHT = Math.floor((CANVAS_HEIGHT - PADDING * 2 - GAP * (ROWS - 1)) / ROWS)

export const DEPARTMENTS: DepartmentConfig[] = [
  {
    id: 'planning',
    label: 'Planning',
    color: 0x8B5CF6,
    x: PADDING,
    y: PADDING,
    width: DEPT_WIDTH,
    height: DEPT_HEIGHT,
    maxDesks: 6,
  },
  {
    id: 'development',
    label: 'Development',
    color: 0x3B82F6,
    x: PADDING + DEPT_WIDTH + GAP,
    y: PADDING,
    width: DEPT_WIDTH,
    height: DEPT_HEIGHT,
    maxDesks: 8,
  },
  {
    id: 'qa',
    label: 'QA',
    color: 0x10B981,
    x: PADDING + (DEPT_WIDTH + GAP) * 2,
    y: PADDING,
    width: DEPT_WIDTH,
    height: DEPT_HEIGHT,
    maxDesks: 6,
  },
  {
    id: 'devsecops',
    label: 'DevSecOps',
    color: 0xF59E0B,
    x: PADDING,
    y: PADDING + DEPT_HEIGHT + GAP,
    width: DEPT_WIDTH,
    height: DEPT_HEIGHT,
    maxDesks: 6,
  },
  {
    id: 'design',
    label: 'Design',
    color: 0xEC4899,
    x: PADDING + DEPT_WIDTH + GAP,
    y: PADDING + DEPT_HEIGHT + GAP,
    width: DEPT_WIDTH,
    height: DEPT_HEIGHT,
    maxDesks: 6,
  },
  {
    id: 'operations',
    label: 'Operations',
    color: 0x64748B,
    x: PADDING + (DEPT_WIDTH + GAP) * 2,
    y: PADDING + DEPT_HEIGHT + GAP,
    width: DEPT_WIDTH,
    height: DEPT_HEIGHT,
    maxDesks: 6,
  },
]

const ROLE_MAP: Record<string, Department> = {
  product: 'planning',
  pm: 'planning',
  lead: 'planning',
  coordinator: 'planning',
  engineer: 'development',
  dev: 'development',
  frontend: 'development',
  backend: 'development',
  fullstack: 'development',
  software: 'development',
  qa: 'qa',
  test: 'qa',
  quality: 'qa',
  ops: 'devsecops',
  sre: 'devsecops',
  infra: 'devsecops',
  security: 'devsecops',
  devsecops: 'devsecops',
  design: 'design',
  ux: 'design',
  ui: 'design',
}

export function getDepartmentForRole(role: string): Department {
  const lower = role.toLowerCase()
  for (const [keyword, dept] of Object.entries(ROLE_MAP)) {
    if (lower.includes(keyword)) {
      return dept
    }
  }
  return 'operations'
}

export function getDepartmentConfig(dept: Department): DepartmentConfig {
  return DEPARTMENTS.find(d => d.id === dept)!
}

export function getDeskPosition(
  deptConfig: DepartmentConfig,
  deskIndex: number,
): { x: number; y: number } {
  const cols = Math.min(4, deptConfig.maxDesks)
  const row = Math.floor(deskIndex / cols)
  const col = deskIndex % cols

  const deskAreaX = deptConfig.x + 30
  const deskAreaY = deptConfig.y + 40
  const spacingX = (deptConfig.width - 60) / Math.max(cols, 1)
  const spacingY = 60

  return {
    x: deskAreaX + col * spacingX + spacingX / 2,
    y: deskAreaY + row * spacingY + 20,
  }
}
