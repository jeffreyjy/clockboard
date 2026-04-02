# ClockBoard

An array of analog clocks that move together to form patterns, display the time, and transition through mesmerizing animations. A React component — canvas-free, SVG-rendered, 60fps via the Web Animations API, zero CSS imports.

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

Drop it in and it works. The default behavior (`clockRandom`) displays the current time at each minute boundary, then transitions through randomized ambient patterns between updates.

The component fills the width of its parent container. The board background extends to fill the full parent dimensions (set `height` via the `style` prop or the parent element), while the clock grid maintains its fixed 20×8 aspect ratio centered within.

## How It Works

ClockBoard renders a 20×8 grid of 160 individual analog clocks. Each clock is an SVG with two hands that can independently rotate to any angle. By coordinating the hand positions across all 160 clocks, the board forms patterns, spells digits, and creates animations.

- **Web Animations API (WAAPI)** drives all hand rotation — animations run on the compositor thread for smooth 60fps performance with zero React re-renders during transitions
- **Shortest-path rotation** — hands always take the shortest angular path to their target, with cumulative angle tracking to preserve rotation direction
- **SVG rendering** — each clock is a lightweight `<svg>` element with two `<rect>` hands and a center hub, no canvas or external rendering libraries
- **CSS Grid layout** — the 20×8 grid uses native CSS Grid with percentage-based gaps for responsive scaling

## Props

**Behavior**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `behavior` | `Behavior` | `clockRandom()` | Dynamic behavior controlling pattern transitions over time |
| `pattern` | `GridPattern` | — | Static pattern override — sets all clocks to a fixed position (disables `behavior`) |
| `duration` | `number` | `5000` | Transition duration in ms when using the `pattern` prop |

When `pattern` is set, it takes priority over `behavior`. The board animates to the given pattern once and holds. When `pattern` is cleared (set to `undefined`), the `behavior` resumes.

**Appearance**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `handColor` | `string` | `'white'` | Color of the clock hands |
| `faceColor` | `string` | `'#141414'` | Background color of each clock face |
| `boardColor` | `string` | `'#171717'` | Background color of the board container |
| `boardPadding` | `string` | `'4%'` | Padding around the clock grid |
| `boardRadius` | `number` | `8` | Border radius of the board in pixels |
| `clockGap` | `string` | `'0.25%'` | Gap between individual clocks |

**Layout**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | — | CSS class on the outer container |
| `style` | `CSSProperties` | — | Inline styles merged onto the outer container |

The outer container is a flexbox that centers the grid. Set `height` on the container (via `style` or parent) and the board background will fill the space, with the clock grid centered within. This prevents black bars when the parent aspect ratio doesn't match the grid.

```tsx
// Full-viewport board — no black bars, grid centered
<ClockBoard style={{ height: '100vh' }} />

// Fixed-size container
<div style={{ width: 800, height: 400 }}>
  <ClockBoard />
</div>
```

## Behaviors

Behaviors are functions that control what the board displays over time. They receive an `apply` callback to push patterns to the grid and return a cleanup function.

```ts
type Behavior = (apply: ApplyPattern) => () => void
type ApplyPattern = (pattern: GridPattern, duration?: number) => void
```

### Built-in Behaviors

**`clockRandom(patterns?, duration?, hold?, timeDuration?, timeHold?)`**

The default. Displays the current system time (24-hour format) at every minute boundary, then transitions through random ambient patterns between updates.

```tsx
import { ClockBoard, clockRandom } from 'clockboard'

// All defaults
<ClockBoard />

// Equivalent to:
<ClockBoard behavior={clockRandom()} />

// Custom timing: faster ambient transitions, longer time display
<ClockBoard behavior={clockRandom(undefined, 3000, 2000, 4000, 15000)} />
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `patterns` | `GridPattern[]` | `ALL_PATTERNS` | Pool of ambient patterns to randomly pick from |
| `duration` | `number` | `5000` | Ambient pattern transition duration (ms) |
| `hold` | `number` | `5000` | Pause between ambient transitions (ms) |
| `timeDuration` | `number` | `5000` | Time display transition duration (ms) |
| `timeHold` | `number` | `10000` | How long the time stays visible before resuming ambient (ms) |

**`clockCycle(patterns?, duration?, hold?, timeDuration?, timeHold?)`**

Same as `clockRandom` but cycles through ambient patterns in order instead of randomly.

```tsx
import { ClockBoard, clockCycle } from 'clockboard'

<ClockBoard behavior={clockCycle()} />
```

Parameters are identical to `clockRandom`.

**`clock(duration?)`**

Pure time display. Shows the current system time and updates every minute. No ambient patterns.

```tsx
import { ClockBoard, clock } from 'clockboard'

<ClockBoard behavior={clock()} />

// Faster transition when the minute changes
<ClockBoard behavior={clock(2000)} />
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `duration` | `number` | `5000` | Transition duration when the time updates (ms) |

**`random(patterns?, duration?, hold?)`**

Continuously transitions through random ambient patterns. No time display.

```tsx
import { ClockBoard, random } from 'clockboard'

<ClockBoard behavior={random()} />
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `patterns` | `GridPattern[]` | `ALL_PATTERNS` | Pool of patterns |
| `duration` | `number` | `5000` | Transition duration (ms) |
| `hold` | `number` | `5000` | Pause between transitions (ms) |

**`cycle(patterns?, duration?, hold?)`**

Cycles through ambient patterns in order. No time display.

```tsx
import { ClockBoard, cycle } from 'clockboard'

<ClockBoard behavior={cycle()} />
```

Parameters are identical to `random`.

### Custom Behaviors

Write your own behavior by matching the `Behavior` signature:

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

The `apply` function accepts any `GridPattern` (an 8×20 array of `[hand1Angle, hand2Angle]` pairs) and an optional duration in milliseconds.

## Patterns

A `GridPattern` is an 8-row × 20-column 2D array where each cell is a `ClockState` — a tuple of two angles in degrees (`[hand1, hand2]`), one per hand. `0°` is 12 o'clock, `90°` is 3 o'clock, `180°` is 6 o'clock, `270°` is 9 o'clock.

### Built-in Ambient Patterns

All 14 patterns are individually exported and also available as the `ALL_PATTERNS` array:

```tsx
import {
  NOON, RADIAL, CONVERGE, CHECKERBOARD, WAVE, VORTEX,
  PINWHEEL, RINGS, CONCENTRIC_RECTS, CROSS_STITCH,
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
| `PINWHEEL` | Hands tangential to radial direction |
| `RINGS` | Angle grows with distance from center — concentric rings |
| `CONCENTRIC_RECTS` | Rectangular borders from edge to center |
| `CROSS_STITCH` | Alternating X and + shapes — woven texture |
| `BLOOM` | Hands splay wider with distance — flower opening |
| `CHEVRONS` | Rows of V-shapes alternating direction |
| `SPIRAL_ARMS` | Twisted V-shapes following a spiral curve |
| `WINDMILL` | 2×2 repeating windmill — each cell rotated 90° from neighbors |

### Using the `pattern` Prop

For static displays or manual control, use the `pattern` prop instead of a behavior:

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

Build a time pattern programmatically with `composeTime`:

```tsx
import { ClockBoard, composeTime } from 'clockboard'

// Static display of 14:30
<ClockBoard pattern={composeTime(14, 30)} />
```

`composeTime(hours, minutes)` returns a full `GridPattern` with the time rendered in the center 18×6 region using styled digits, a colon separator, and an idle border.

### Custom Patterns

Create your own `GridPattern` — an 8×20 array:

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

The board is a fixed 20 columns × 8 rows (160 clocks). The clock grid maintains this aspect ratio regardless of the container size.

**Time layout within the grid:**
- The outermost ring of clocks (border) stays in idle position (both hands at 225°)
- The inner 18×6 region displays content
- Each digit occupies a 4×6 block
- The colon between hours and minutes is a 2×4 block
- Layout: `[border] [digit] [digit] [colon] [digit] [digit] [border]`

## Multiple Instances

Each `ClockBoard` is fully independent. Run multiple boards on the same page with different behaviors, patterns, and styles:

```tsx
<ClockBoard behavior={clock()} boardColor="#1a1a2e" handColor="#e94560" />
<ClockBoard behavior={random()} boardColor="#0f3460" handColor="#16213e" />
<ClockBoard pattern={RADIAL} boardColor="#222" faceColor="#333" />
```

## Types

All types are exported for TypeScript consumers:

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

To run ClockBoard as a standalone display on any screen, serve a single page:

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

Set the body background to match `boardColor` so the display is seamless edge to edge. Open the page in any full-screen browser.

## License

MIT
