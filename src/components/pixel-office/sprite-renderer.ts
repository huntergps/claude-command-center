import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { SpriteState } from './types'

const STATE_COLORS: Record<SpriteState, number> = {
  idle: 0x4ADE80,
  writing: 0xFBBF24,
  researching: 0x818CF8,
  executing: 0x38BDF8,
  error: 0xF87171,
  waiting: 0x94A3B8,
}

const SKIN_PALETTE = [0xF5D6B8, 0xD4A574, 0xA67B5B, 0xE8C4A0, 0xC68E6A, 0x8D5E3C]

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export class SpriteRenderer {
  container: Container
  private body: Graphics
  private head: Graphics
  private leftArm: Graphics
  private rightArm: Graphics
  private stateIndicator: Graphics
  private nameTag: Text
  private state: SpriteState
  private elapsed: number = 0
  private skinColor: number
  private deptColor: number

  constructor(name: string, state: SpriteState, deptColor: number) {
    this.state = state
    this.deptColor = deptColor
    this.skinColor = SKIN_PALETTE[hashCode(name) % SKIN_PALETTE.length]
    this.container = new Container()

    // State indicator dot (above head)
    this.stateIndicator = new Graphics()
    this.container.addChild(this.stateIndicator)

    // Head
    this.head = new Graphics()
    this.container.addChild(this.head)

    // Body
    this.body = new Graphics()
    this.container.addChild(this.body)

    // Arms
    this.leftArm = new Graphics()
    this.rightArm = new Graphics()
    this.container.addChild(this.leftArm)
    this.container.addChild(this.rightArm)

    // Name tag
    this.nameTag = new Text({
      text: name.length > 8 ? name.slice(0, 7) + '.' : name,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 9,
        fill: 0xCCCCCC,
        align: 'center',
      }),
    })
    this.nameTag.anchor.set(0.5, 0)
    this.nameTag.position.set(0, 28)
    this.container.addChild(this.nameTag)

    this.drawCharacter()
    this.drawStateIndicator()
  }

  private drawCharacter() {
    // Head: 12x12 rounded rect
    this.head.clear()
    this.head.roundRect(-6, -24, 12, 12, 2)
    this.head.fill(this.skinColor)

    // Eyes
    this.head.rect(-3, -20, 2, 2)
    this.head.fill(0x222222)
    this.head.rect(1, -20, 2, 2)
    this.head.fill(0x222222)

    // Body: 14x16 rect
    this.body.clear()
    this.body.rect(-7, -12, 14, 16)
    this.body.fill(this.deptColor)

    // Legs
    this.body.rect(-5, 4, 4, 6)
    this.body.fill(0x374151)
    this.body.rect(1, 4, 4, 6)
    this.body.fill(0x374151)

    // Arms (base position)
    this.drawArms(0)
  }

  private drawArms(offset: number) {
    this.leftArm.clear()
    this.leftArm.rect(-11, -10 + offset, 4, 10)
    this.leftArm.fill(this.deptColor)
    // Hand
    this.leftArm.rect(-11, 0 + offset, 4, 3)
    this.leftArm.fill(this.skinColor)

    this.rightArm.clear()
    this.rightArm.rect(7, -10 + offset, 4, 10)
    this.rightArm.fill(this.deptColor)
    // Hand
    this.rightArm.rect(7, 0 + offset, 4, 3)
    this.rightArm.fill(this.skinColor)
  }

  private drawStateIndicator() {
    const color = STATE_COLORS[this.state]
    this.stateIndicator.clear()
    this.stateIndicator.circle(0, -30, 3)
    this.stateIndicator.fill(color)

    // Glow ring
    this.stateIndicator.circle(0, -30, 5)
    this.stateIndicator.fill({ color, alpha: 0.3 })
  }

  setState(state: SpriteState) {
    if (this.state === state) return
    this.state = state
    this.drawStateIndicator()
  }

  update(delta: number) {
    this.elapsed += delta

    switch (this.state) {
      case 'idle': {
        // Gentle bob
        const bob = Math.sin(this.elapsed * 0.03) * 1.5
        this.head.position.y = bob
        this.body.position.y = bob
        this.leftArm.position.y = bob
        this.rightArm.position.y = bob
        break
      }

      case 'writing': {
        // Typing motion on arms
        const bob = Math.sin(this.elapsed * 0.03) * 0.5
        this.head.position.y = bob
        this.body.position.y = bob

        const leftOffset = Math.sin(this.elapsed * 0.15) * 2
        const rightOffset = Math.sin(this.elapsed * 0.15 + Math.PI) * 2
        this.drawArms(0)
        this.leftArm.position.y = bob + leftOffset
        this.rightArm.position.y = bob + rightOffset

        // Pulsing state dot
        const pulse = 0.5 + Math.sin(this.elapsed * 0.08) * 0.5
        this.stateIndicator.alpha = pulse
        break
      }

      case 'researching': {
        // Slow sway
        const sway = Math.sin(this.elapsed * 0.02) * 2
        this.head.position.x = sway
        this.head.position.y = 0
        this.body.position.y = 0
        this.leftArm.position.y = 0
        this.rightArm.position.y = 0

        // Pulsing state dot
        const pulse = 0.5 + Math.sin(this.elapsed * 0.06) * 0.5
        this.stateIndicator.alpha = pulse
        break
      }

      case 'executing': {
        // Small bounce
        const bounce = Math.abs(Math.sin(this.elapsed * 0.06)) * 2
        this.head.position.y = -bounce
        this.body.position.y = -bounce
        this.leftArm.position.y = -bounce
        this.rightArm.position.y = -bounce

        // Spinning glow - redraw indicator with rotation effect
        const spin = this.elapsed * 0.1
        this.stateIndicator.clear()
        const color = STATE_COLORS.executing
        this.stateIndicator.circle(0, -30, 3)
        this.stateIndicator.fill(color)
        const glowX = Math.cos(spin) * 3
        const glowY = Math.sin(spin) * 3
        this.stateIndicator.circle(glowX, -30 + glowY, 2)
        this.stateIndicator.fill({ color, alpha: 0.5 })
        break
      }

      case 'error': {
        // Blinking red
        const blink = Math.sin(this.elapsed * 0.12) > 0 ? 1 : 0.2
        this.stateIndicator.alpha = blink
        // Slight shake
        const shake = Math.sin(this.elapsed * 0.2) * 1
        this.container.pivot.x = -shake
        break
      }

      case 'waiting': {
        // Very subtle breathing
        const breath = Math.sin(this.elapsed * 0.015) * 0.5
        this.head.position.y = breath
        this.body.position.y = breath
        this.leftArm.position.y = breath
        this.rightArm.position.y = breath
        this.stateIndicator.alpha = 0.5
        break
      }
    }
  }
}
