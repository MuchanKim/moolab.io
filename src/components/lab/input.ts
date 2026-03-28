// Module-level input state — shared between CyberpunkScene and Vehicle
// Bypasses React/R3F ref boundary issues

export const INPUT = {
  keys: {} as Record<string, boolean>,
  mouseX: 0,
  mouseY: 0,
}

const CODE_MAP: Record<string, string> = {
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
  KeyQ: 'q', KeyE: 'e',
  Space: 'space', ShiftLeft: 'shift', ShiftRight: 'shift',
  ArrowUp: 'w', ArrowDown: 's', ArrowLeft: 'a', ArrowRight: 'd',
}

const KEY_MAP: Record<string, string> = {
  w: 'w', a: 'a', s: 's', d: 'd', q: 'q', e: 'e',
  ' ': 'space', shift: 'shift',
  arrowup: 'w', arrowdown: 's', arrowleft: 'a', arrowright: 'd',
}

function resolve(e: KeyboardEvent): string | undefined {
  return CODE_MAP[e.code] || KEY_MAP[e.key.toLowerCase()]
}

export function initInput() {
  const onDown = (e: KeyboardEvent) => {
    const m = resolve(e)
    if (m) { INPUT.keys[m] = true; e.preventDefault() }
  }
  const onUp = (e: KeyboardEvent) => {
    const m = resolve(e)
    if (m) { INPUT.keys[m] = false }
  }
  const onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement) {
      INPUT.mouseX += e.movementX
      INPUT.mouseY += e.movementY
    }
  }

  document.addEventListener('keydown', onDown)
  document.addEventListener('keyup', onUp)
  document.addEventListener('mousemove', onMouseMove)

  return () => {
    document.removeEventListener('keydown', onDown)
    document.removeEventListener('keyup', onUp)
    document.removeEventListener('mousemove', onMouseMove)
  }
}
