# ClockBoard

A 20×8 grid of analog clocks that animate together to form patterns and display the time. Canvas-rendered React component — 60fps, zero CSS imports.

## Install

```bash
pnpm add clockboard
```

Peer dependency: `react >=18`.

## Quick Start

```tsx
import { ClockBoard } from 'clockboard'

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <ClockBoard />
    </div>
  )
}
```

The default behavior (`clockRandom`) cycles through randomized ambient patterns, displaying the current time whenever the minute changes.

The board fills its parent. The clock grid keeps a fixed 20×8 aspect ratio and scales uniformly to fit the padded area — constrained by whichever dimension is tighter.

## Props

**Behavior**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `behavior` | `Behavior` | `clockRandom()` | Dynamic behavior controlling pattern transitions over time |
| `pattern` | `GridPattern` | — | Static pattern — sets all clocks to a fixed position (disables `behavior`) |
| `duration` | `number` | `10000` | Transition duration in ms when using the `pattern` prop |

When `pattern` is set, it takes priority over `behavior`. The board animates to the given pattern once and holds. When `pattern` is cleared (set to `undefined`), the `behavior` resumes.

**Appearance**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `handColor` | `string` | `'rgb(222, 222, 222)'` | Color of the clock hands |
| `faceColor` | `string` | `'#141414'` | Background color of each clock face |
| `boardColor` | `string` | `'#171717'` | Background of the board container — any CSS `background` value, including gradients |
| `boardPadding` | `string` | `'4%'` | Padding around the clock grid |
| `boardRadius` | `number` | `8` | Border radius of the board in pixels |
| `clockGap` | `string` | `'0.5%'` | Gap between individual clocks |
| `easing` | `'ease-in-out' \| 'linear'` | `'ease-in-out'` | Easing curve for hand transitions |
| `rotation` | `'clockwise' \| 'shortest'` | `'clockwise'` | Direction hands rotate — `'clockwise'` always sweeps forward; `'shortest'` takes the shortest arc |
| `className` | `string` | — | CSS class on the outer container |
| `style` | `CSSProperties` | — | Inline styles on the outer container |

```tsx
// Full-viewport board
<ClockBoard style={{ height: '100vh' }} />

// Fixed-size container
<div style={{ width: 800, height: 400 }}>
  <ClockBoard />
</div>
```

## Behaviors

Behaviors control what the board displays over time. They receive an `apply` callback to push patterns and return a cleanup function.

```ts
type Behavior = (apply: ApplyPattern) => () => void
type ApplyPattern = (pattern: GridPattern, duration?: number) => void
```

### Built-in Behaviors

**`clockRandom`**

The default. Cycles through random ambient patterns and displays the current system time (24-hour format) whenever the minute changes.

```tsx
import { ClockBoard, clockRandom } from 'clockboard'

<ClockBoard />
// equivalent to:
<ClockBoard behavior={clockRandom()} />

// Custom options
<ClockBoard behavior={clockRandom({ duration: 3000, hold: 2000, timeDuration: 4000, timeHold: 15000 })} />
```

Accepts an options object or positional args `(patterns?, duration?, hold?, timeDuration?, timeHold?)`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `patterns` | `GridPattern[]` | `ALL_PATTERNS` | Pool of ambient patterns |
| `duration` | `number` | `10000` | Ambient transition duration (ms) |
| `hold` | `number` | `800` | Pause between ambient transitions (ms) |
| `timeDuration` | `number` | `5000` | Time display transition duration (ms) |
| `timeHold` | `number` | `10000` | How long the time stays visible before resuming ambient (ms) |

**`clockCycle`**

Same as `clockRandom` but steps through ambient patterns in order rather than randomly. Same signatures and defaults.

```tsx
import { ClockBoard, clockCycle } from 'clockboard'

<ClockBoard behavior={clockCycle()} />
<ClockBoard behavior={clockCycle({ hold: 250 })} />
```

**`clock`**

Pure time display. Shows the current system time and updates every minute. No ambient patterns.

```tsx
import { ClockBoard, clock } from 'clockboard'

<ClockBoard behavior={clock()} />
<ClockBoard behavior={clock({ duration: 2000 })} />
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `duration` | `number` | `10000` | Transition duration when the time updates (ms) |

**`random`**

Continuously transitions through random ambient patterns. No time display.

```tsx
import { ClockBoard, random } from 'clockboard'

<ClockBoard behavior={random()} />
<ClockBoard behavior={random({ hold: 250 })} />
```

Accepts an options object or positional args `(patterns?, duration?, hold?)`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `patterns` | `GridPattern[]` | `ALL_PATTERNS` | Pool of patterns |
| `duration` | `number` | `10000` | Transition duration (ms) |
| `hold` | `number` | `800` | Pause after transition before next (ms) |

**`cycle`**

Cycles through ambient patterns in order. No time display. Same signatures and defaults as `random`.

```tsx
import { ClockBoard, cycle } from 'clockboard'

<ClockBoard behavior={cycle()} />
<ClockBoard behavior={cycle({ duration: 3000 })} />
```

### Custom Behaviors

```tsx
import { ClockBoard, NOON, RADIAL } from 'clockboard'
import type { Behavior } from 'clockboard'

const alternate: Behavior = (apply) => {
  let flip = false
  const interval = setInterval(() => {
    apply(flip ? NOON : RADIAL, 3000)
    flip = !flip
  }, 8000)
  apply(NOON, 3000)
  return () => clearInterval(interval)
}

<ClockBoard behavior={alternate} />
```

The `apply` function accepts any `GridPattern` and an optional duration in milliseconds.

## Patterns

A `GridPattern` is an 8-row × 20-column 2D array where each cell is a `ClockState` — a tuple of two angles in degrees (`[hand1, hand2]`). `0°` is 12 o'clock, `90°` is 3 o'clock, `180°` is 6 o'clock, `270°` is 9 o'clock.

### Built-in Ambient Patterns

All 13 patterns are individually exported and also available as the `ALL_PATTERNS` array:

```tsx
import {
  NOON, RADIAL, CONVERGE, CHECKERBOARD, WAVE, VORTEX,
  RINGS, CONCENTRIC_RECTS, CROSS_STITCH,
  BLOOM, CHEVRONS, SPIRAL_ARMS, WINDMILL,
  ALL_PATTERNS,
  randomPattern, // generates a unique random pattern each call
} from 'clockboard'
```

| Pattern | Description |
|---------|-------------|
| `NOON` | All hands at 12 o'clock — clean reset |
| `RADIAL` | Hands radiate outward from grid center — starburst |
| `CONVERGE` | All hands point inward toward center — vortex sink |
| `CHECKERBOARD` | Alternating vertical and horizontal bars |
| `WAVE` | Sine wave undulating across columns |
| `VORTEX` | Radial direction twisted by distance — galaxy spiral |
| `RINGS` | Angle grows with distance from center — concentric rings |
| `CONCENTRIC_RECTS` | Rectangular borders from edge to center |
| `CROSS_STITCH` | Alternating X and + shapes — woven texture |
| `BLOOM` | Hands splay wider with distance — flower opening |
| `CHEVRONS` | Rows of V-shapes alternating direction |
| `SPIRAL_ARMS` | Twisted V-shapes following a spiral curve |
| `WINDMILL` | 2×2 repeating windmill — each cell rotated 90° from neighbors |

### Using the `pattern` Prop

```tsx
import { useState } from 'react'
import { ClockBoard, RADIAL, VORTEX, NOON } from 'clockboard'

function App() {
  const [pattern, setPattern] = useState(RADIAL)

  return (
    <>
      <ClockBoard pattern={pattern} duration={3000} />
      <button onClick={() => setPattern(RADIAL)}>Radial</button>
      <button onClick={() => setPattern(VORTEX)}>Vortex</button>
      <button onClick={() => setPattern(NOON)}>Reset</button>
    </>
  )
}
```

### Time Composition

```tsx
import { ClockBoard, composeTime } from 'clockboard'

// Static display of 14:30
<ClockBoard pattern={composeTime(14, 30)} />
```

`composeTime(hours, minutes)` returns a full `GridPattern` with the time rendered in the center 18×6 region.

### Custom Patterns

```tsx
import type { GridPattern, ClockState } from 'clockboard'

const myPattern: GridPattern = Array.from({ length: 8 }, (_, row) =>
  Array.from({ length: 20 }, (_, col): ClockState => {
    const angle = (row * 20 + col) * (360 / 160)
    return [angle, angle + 180]
  })
)

<ClockBoard pattern={myPattern} />
```

## Grid Dimensions

The board is a fixed 20 columns × 8 rows (160 clocks).

**Time layout within the grid:**
- The outermost ring of clocks (border) stays in idle position (both hands at 225°)
- The inner 18×6 region displays content
- Each digit occupies a 4×6 block
- The colon between hours and minutes is a 2×4 block
- Layout: `[border] [digit] [digit] [colon] [digit] [digit] [border]`

## Multiple Instances

Each `ClockBoard` is fully independent:

```tsx
<ClockBoard behavior={clock()} boardColor="#1a1a2e" handColor="#e94560" />
<ClockBoard behavior={random()} boardColor="#0f3460" handColor="#16213e" />
<ClockBoard pattern={RADIAL} boardColor="#222" faceColor="#333" />
```

## Types

```tsx
import type {
  ClockState,      // [hand1: number, hand2: number]
  GridPattern,     // ClockState[][] (8 rows × 20 cols)
  ApplyPattern,    // (pattern: GridPattern, duration?: number) => void
  Behavior,        // (apply: ApplyPattern) => () => void
  ClockBoardProps,
} from 'clockboard'
```

## Full-Screen Display

```html
<!DOCTYPE html>
<html>
<head><style>body { margin: 0; background: #171717; }</style></head>
<body>
  <div id="root"></div>
  <script type="module">
    import { createRoot } from 'react-dom/client'
    import { ClockBoard } from 'clockboard'
    createRoot(document.getElementById('root')).render(
      <ClockBoard style={{ height: '100vh' }} />
    )
  </script>
</body>
</html>
```

Set the body background to match `boardColor` so the display is seamless edge to edge.

## Changelog

### 0.1.0
- Overhauled animation engine for reliable, uninterrupted transitions
- Fixed animation timing when tab loses focus or window is backgrounded
- Added gradient support for `boardColor`
- Fixed resizing issues

### 0.0.1
- Initial release

## License

MIT
