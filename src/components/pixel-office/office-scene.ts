import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { Department, DepartmentConfig, PixelAgent } from './types'
import { DEPARTMENTS, getDepartmentConfig, getDeskPosition } from './departments'
import { SpriteRenderer } from './sprite-renderer'

const STAR_COUNT = 200
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800

interface Star {
  x: number
  y: number
  size: number
  speed: number
  phase: number
}

export class OfficeScene {
  private app: Application | null = null
  private departmentContainers: Map<Department, Container> = new Map()
  private agentSprites: Map<number, SpriteRenderer> = new Map()
  private agentDeskIndex: Map<string, Map<number, number>> = new Map()
  private starsGraphics: Graphics | null = null
  private stars: Star[] = []
  private elapsed: number = 0

  async init(canvas: HTMLCanvasElement) {
    this.app = new Application()
    await this.app.init({
      canvas,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: 0x0D1117,
      antialias: false,
      resolution: 1,
    })

    this.drawStarfield()
    this.drawCorridors()
    this.drawDepartments()

    this.app.ticker.add((ticker) => {
      this.elapsed += ticker.deltaTime
      this.updateStars()
      this.agentSprites.forEach((sprite) => {
        sprite.update(ticker.deltaTime)
      })
    })
  }

  private drawStarfield() {
    if (!this.app) return
    this.starsGraphics = new Graphics()
    this.app.stage.addChild(this.starsGraphics)

    this.stars = []
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      })
    }
    this.updateStars()
  }

  private updateStars() {
    if (!this.starsGraphics) return
    this.starsGraphics.clear()

    for (const star of this.stars) {
      const alpha = 0.3 + Math.sin(this.elapsed * star.speed + star.phase) * 0.3
      this.starsGraphics.circle(star.x, star.y, star.size)
      this.starsGraphics.fill({ color: 0xFFFFFF, alpha })
    }
  }

  private drawCorridors() {
    if (!this.app) return
    const corridors = new Graphics()

    // Horizontal corridor between top row
    for (let i = 0; i < 2; i++) {
      const left = DEPARTMENTS[i]
      const right = DEPARTMENTS[i + 1]
      const cx = left.x + left.width
      const cy = left.y + left.height / 2 - 8
      corridors.rect(cx, cy, right.x - cx, 16)
      corridors.fill({ color: 0x1E293B, alpha: 0.6 })

      // Dotted path
      for (let dx = 4; dx < right.x - cx; dx += 8) {
        corridors.rect(cx + dx, cy + 6, 4, 4)
        corridors.fill({ color: 0x334155, alpha: 0.8 })
      }
    }

    // Horizontal corridor between bottom row
    for (let i = 3; i < 5; i++) {
      const left = DEPARTMENTS[i]
      const right = DEPARTMENTS[i + 1]
      const cx = left.x + left.width
      const cy = left.y + left.height / 2 - 8
      corridors.rect(cx, cy, right.x - cx, 16)
      corridors.fill({ color: 0x1E293B, alpha: 0.6 })

      for (let dx = 4; dx < right.x - cx; dx += 8) {
        corridors.rect(cx + dx, cy + 6, 4, 4)
        corridors.fill({ color: 0x334155, alpha: 0.8 })
      }
    }

    // Vertical corridors between top and bottom rows
    for (let i = 0; i < 3; i++) {
      const top = DEPARTMENTS[i]
      const bottom = DEPARTMENTS[i + 3]
      const cx = top.x + top.width / 2 - 8
      const cy = top.y + top.height
      corridors.rect(cx, cy, 16, bottom.y - cy)
      corridors.fill({ color: 0x1E293B, alpha: 0.6 })

      for (let dy = 4; dy < bottom.y - cy; dy += 8) {
        corridors.rect(cx + 6, cy + dy, 4, 4)
        corridors.fill({ color: 0x334155, alpha: 0.8 })
      }
    }

    this.app.stage.addChild(corridors)
  }

  private drawDepartments() {
    if (!this.app) return

    for (const dept of DEPARTMENTS) {
      const container = new Container()

      // Floor
      const floor = new Graphics()
      floor.roundRect(dept.x, dept.y, dept.width, dept.height, 4)
      floor.fill({ color: dept.color, alpha: 0.08 })
      floor.roundRect(dept.x, dept.y, dept.width, dept.height, 4)
      floor.stroke({ color: dept.color, alpha: 0.3, width: 1 })
      container.addChild(floor)

      // Department label
      const label = new Text({
        text: dept.label.toUpperCase(),
        style: new TextStyle({
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 'bold',
          fill: dept.color,
          letterSpacing: 2,
        }),
      })
      label.position.set(dept.x + 10, dept.y + 8)
      container.addChild(label)

      // Draw desk positions
      const desks = new Graphics()
      for (let i = 0; i < dept.maxDesks; i++) {
        const pos = getDeskPosition(dept, i)
        // Desk surface
        desks.rect(pos.x - 12, pos.y + 10, 24, 8)
        desks.fill({ color: 0x1E293B, alpha: 0.8 })
        // Monitor
        desks.rect(pos.x - 6, pos.y + 2, 12, 8)
        desks.fill({ color: 0x0F172A, alpha: 0.9 })
        desks.stroke({ color: 0x334155, alpha: 0.6, width: 1 })
        // Screen glow when unoccupied
        desks.rect(pos.x - 4, pos.y + 4, 8, 4)
        desks.fill({ color: dept.color, alpha: 0.15 })
      }
      container.addChild(desks)

      this.app.stage.addChild(container)
      this.departmentContainers.set(dept.id, container)
    }
  }

  updateAgents(agents: PixelAgent[]) {
    if (!this.app) return

    const currentIds = new Set(agents.map(a => a.id))

    // Remove agents no longer present
    this.agentSprites.forEach((sprite, id) => {
      if (!currentIds.has(id)) {
        sprite.container.parent?.removeChild(sprite.container)
        this.agentSprites.delete(id)
      }
    })

    // Track desk assignments per department
    const deptAssignments = new Map<string, number>()
    for (const dept of DEPARTMENTS) {
      deptAssignments.set(dept.id, 0)
    }

    for (const agent of agents) {
      const deptConfig = getDepartmentConfig(agent.department)
      const deptContainer = this.departmentContainers.get(agent.department)
      if (!deptContainer) continue

      let sprite = this.agentSprites.get(agent.id)

      if (!sprite) {
        // Create new sprite
        sprite = new SpriteRenderer(agent.name, agent.state, deptConfig.color)
        this.agentSprites.set(agent.id, sprite)
        this.app.stage.addChild(sprite.container)
      }

      // Assign desk
      const deskIdx = deptAssignments.get(agent.department) ?? 0
      deptAssignments.set(agent.department, deskIdx + 1)

      const clamped = deskIdx % deptConfig.maxDesks
      const pos = getDeskPosition(deptConfig, clamped)

      // Smooth movement toward target
      const dx = pos.x - sprite.container.position.x
      const dy = pos.y - sprite.container.position.y
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        sprite.container.position.x += dx * 0.1
        sprite.container.position.y += dy * 0.1
      } else {
        sprite.container.position.set(pos.x, pos.y)
      }

      sprite.setState(agent.state)
    }
  }

  destroy() {
    if (this.app) {
      this.app.destroy(true)
      this.app = null
    }
    this.departmentContainers.clear()
    this.agentSprites.clear()
  }
}
