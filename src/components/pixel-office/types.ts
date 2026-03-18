export type Department = 'planning' | 'development' | 'qa' | 'devsecops' | 'design' | 'operations'
export type SpriteState = 'idle' | 'writing' | 'researching' | 'executing' | 'error' | 'waiting'

export interface PixelAgent {
  id: number
  name: string
  department: Department
  state: SpriteState
  x: number
  y: number
  targetX: number
  targetY: number
}

export interface DepartmentConfig {
  id: Department
  label: string
  color: number
  x: number
  y: number
  width: number
  height: number
  maxDesks: number
}
