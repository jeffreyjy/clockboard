# ClockBoard

A 20×8 grid of analog clocks that animate together to form patterns, spin, and display the time. Canvas-rendered React component — 60fps, zero CSS imports.

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

The default behavior (`aliveTime`) is a generative animation that cycles through moods — drifting between patterns, spinning, and periodically displaying the current time. Every viewing is different.

The board fills its parent. The clock grid keeps a fixed 20×8 aspect ratio and scales uniformly to fit — constrained by whichever dimension is tighter.

## Props

**Behavior**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `behavior` | `Behavior` | `aliveTime()` | Controls what the board does over time |
| `pattern` | `GridPattern` | — | Static pattern — sets all clocks to a fixed position (disables `behavior`) |
| `duration` | `number` | `10000` | Transition duration in ms when using the `pattern` prop. Use `0` to snap instantly. |

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
| `easing` | `'ease-in-out' \| 'linear' \| (t: number) => number` | `'ease-in-out'` | Default easing curve for transitions — `'ease-in-out'` is a trapezoidal profile (ramp up, constant speed cruise, ramp down). Pass a custom function mapping `[0,1] → [0,1]` for full control |
| `rotation` | `'clockwise' \| 'shortest'` | `'clockwise'` | Direction hands rotate — `'clockwise'` always sweeps forward; `'shortest'` takes the shortest arc |
| `className` | `string` | — | CSS class on the outer container |
| `style` | `CSSProperties` | — | Inline styles on the outer container |

## How It Works

ClockBoard's animation system has three layers:

**Engine** — The canvas rendering loop. It receives commands via `apply(pattern, options)` and animates clock hands from their current positions to target positions. Supports per-action easing, per-clock stagger delays, and two animation modes (standard lerp and two-phase spin reveal).

**Actions** — The operations you can tell the board to do. Each action is atomic — it runs to completion before the next one starts, enforced structurally via `onComplete` callbacks. Actions include:
- **Transition** — move hands to a target pattern
- **Spin** — uniform rotation (via `absolute: true` targets)
- **Spin reveal** — uniform rotation that lands on a target pattern (via `spinRevolutions`)

**Behaviors** — Programs that orchestrate actions over time. They receive an `apply` callback and return a cleanup function. Range from simple (`loop` a fixed sequence) to complex (the generative `alive` behavior with moods and randomness).

## Behaviors

### Built-in Behaviors

**`aliveTime`** — The default. A generative behavior that cycles through three moods (drift, spin, restless) with diverse transitions and stagger effects. Displays the current time whenever the minute changes. Every viewing is unique.

```tsx
<ClockBoard />
// equivalent to:
<ClockBoard behavior={aliveTime()} />
```

**`alive`** — Same as `aliveTime` but without time display. Pure generative animation.

```tsx
<ClockBoard behavior={alive()} />
```

**`concentricDance`** — Looping INWARD opposite spin with center-out stagger.

```tsx
<ClockBoard behavior={concentricDance()} />
```

**`gentleDrift`** — Slow ambient pattern transitions with random stagger, looping.

```tsx
<ClockBoard behavior={gentleDrift()} />
```

**`clockRandom`** — Cycles through random ambient patterns, displaying the time whenever the minute changes. The previous default.

```tsx
<ClockBoard behavior={clockRandom()} />
<ClockBoard behavior={clockRandom({ duration: 3000, hold: 2000, timeDuration: 4000, timeHold: 15000 })} />
```

**`clockCycle`** — Same as `clockRandom` but steps through patterns in order.

**`clock`** — Pure time display. Shows the current system time and updates every minute.

```tsx
<ClockBoard behavior={clock()} />
```

**`cycle`** — Cycles through ambient patterns in order. No time display.

**`random`** — Random ambient pattern transitions. No time display.

All built-in behaviors accept an optional `stagger` field in their options:

```tsx
<ClockBoard behavior={clockRandom({ stagger: stagger.centerOut(500) })} />
<ClockBoard behavior={cycle({ stagger: stagger.leftToRight(600) })} />
```

### Composition: `sequence` and `loop`

Build behaviors declaratively from steps:

```tsx
import { ClockBoard, loop, sequence, NOON, RADIAL, VORTEX } from 'clockboard'

// Play once and stop
<ClockBoard behavior={sequence([
  { pattern: NOON, duration: 2000, hold: 500 },
  { pattern: RADIAL, duration: 3000, hold: 1000 },
  { pattern: VORTEX, duration: 3000 },
])} />

// Repeat forever
<ClockBoard behavior={loop([
  { pattern: RADIAL, duration: 3000, hold: 1000 },
  { pattern: VORTEX, duration: 3000, hold: 1000 },
])} />
```

**SequenceStep fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pattern` | `GridPattern \| () => GridPattern` | *required* | Target pattern — or a function for dynamic patterns |
| `duration` | `number` | `10000` | Transition duration (ms). Ignored when `spinRevolutions` is set. |
| `hold` | `number` | `0` | Pause after this step before the next (ms) |
| `easing` | `(t: number) => number` | default easing | Per-step easing override |
| `absolute` | `boolean` | `false` | Use raw target angles — for multi-revolution spin |
| `stagger` | `StaggerFn` | — | Per-clock animation delay |
| `spinRevolutions` | `number` | — | Enables spin reveal mode (see below) |
| `spinDirection` | `'clockwise' \| 'counterclockwise' \| 'opposite'` | `'clockwise'` | Spin direction |
| `revolutionDuration` | `number` | `10000` | Duration of one revolution (ms) |

### Spin

The `spin()` wrapper returns `SequenceStep[]` — spread it into `loop()` or `sequence()`:

```tsx
import { ClockBoard, loop, spin } from 'clockboard'

// Default: 3 revolutions, 10s each, both hands clockwise
<ClockBoard behavior={loop(spin())} />
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `start` | `GridPattern` | `uniformPattern(0, 180)` | Starting hand positions |
| `revolutions` | `number` | `3` | Number of full rotations |
| `opposite` | `boolean` | `false` | Hour hand spins opposite direction |
| `revolutionDuration` | `number` | `10000` | Duration of one revolution (ms) |
| `easing` | `(t: number) => number` | `trapezoid(0.10)` | Easing curve |
| `stagger` | `StaggerFn` | — | Per-clock animation delay |

**Spin presets** return `SequenceStep[]` with setup + spin, ready to compose:

```tsx
import { loop, concentricSpin, waveSpin } from 'clockboard'

<ClockBoard behavior={loop(concentricSpin())} />
<ClockBoard behavior={loop(waveSpin())} />

// Mix presets with other steps
<ClockBoard behavior={loop([
  ...concentricSpin(),
  { pattern: RADIAL, duration: 3000, hold: 1000 },
  ...waveSpin(),
])} />
```

For full manual control, use `uniformPattern`, `rotateAll`, and `absolute: true`:

```tsx
const start = uniformPattern(0, 180)

loop([
  { pattern: start, duration: 0 },
  { pattern: rotateAll(start, 1080, -720), duration: 12000, absolute: true },
])
```

- `uniformPattern(minuteAngle, hourAngle)` — every clock set to the same hand positions
- `rotateAll(pattern, minuteDegrees, hourDegrees?)` — offset all hands. Pass two values for independent control (e.g., minute clockwise, hour counterclockwise).

### Spin Reveal

Use `spinRevolutions` to create a spin-to-pattern reveal. Hands spin uniformly, then individually decelerate to land at the target pattern. The transition from spinning to landing is seamless — velocity-matched per-hand quadratic deceleration.

```tsx
import { ClockBoard, composeTime, stagger, uniformPattern } from 'clockboard'
import type { Behavior } from 'clockboard'

const start = uniformPattern(0, 180)
const time = composeTime(14, 30)

const reveal: Behavior = (apply) => {
  apply(start, { duration: 3000, onComplete: () => {
    apply(time, {
      spinRevolutions: 2,
      revolutionDuration: 5000,
      stagger: stagger.leftToRight(2000),
    })
  }})
  return () => {}
}
```

Or declaratively with `sequence`:

```tsx
import { sequence, composeTime, uniformPattern, stagger } from 'clockboard'

const time = composeTime(14, 30)

const reveal = sequence([
  { pattern: uniformPattern(0, 180), duration: 3000 },
  { pattern: time, spinRevolutions: 2, revolutionDuration: 5000, stagger: stagger.leftToRight(2000) },
])
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `spinRevolutions` | `number` | — | Number of uniform cruise revolutions before landing |
| `spinDirection` | `'clockwise' \| 'counterclockwise' \| 'opposite'` | `'clockwise'` | Spin direction. `'opposite'` makes minute CW and hour CCW. |
| `revolutionDuration` | `number` | `10000` | Duration of one revolution (ms). Total duration is auto-computed. |
| `stagger` | `StaggerFn` | — | Per-clock animation delay |

When `spinRevolutions` is set, `easing`, `absolute`, and `duration` are ignored — the engine manages timing and easing internally.

### Stagger

Stagger offsets the start time of each clock's animation, creating wave-like effects:

```tsx
import { ClockBoard, loop, spin, stagger } from 'clockboard'

<ClockBoard behavior={loop(spin({ stagger: stagger.leftToRight(2000) }))} />
```

The total action time becomes `duration + maxDelay`. `onComplete` fires when the last clock finishes.

**Built-in stagger functions:**

| Function | Effect |
|----------|--------|
| `stagger.leftToRight(maxDelay)` | Left edge starts first |
| `stagger.rightToLeft(maxDelay)` | Right edge starts first |
| `stagger.topToBottom(maxDelay)` | Top row starts first |
| `stagger.bottomToTop(maxDelay)` | Bottom row starts first |
| `stagger.centerOut(maxDelay)` | Center clocks start first |
| `stagger.edgesIn(maxDelay)` | Edge clocks start first |
| `stagger.randomStagger(maxDelay)` | Random delay per clock |

Custom stagger functions receive `(row, col)` and return delay in ms:

```tsx
import type { StaggerFn } from 'clockboard'

const checkerStagger: StaggerFn = (row, col) =>
  (row + col) % 2 === 0 ? 0 : 400
```

### Custom Behaviors

For complex logic (time-awareness, randomness, conditional branching), write a behavior function directly:

```tsx
import { ClockBoard, NOON, RADIAL } from 'clockboard'
import type { Behavior } from 'clockboard'

const alternate: Behavior = (apply) => {
  let flip = false
  let timer: ReturnType<typeof setTimeout>

  function step() {
    apply(flip ? NOON : RADIAL, {
      duration: 3000,
      onComplete: () => { timer = setTimeout(step, 2000) },
    })
    flip = !flip
  }

  step()
  return () => clearTimeout(timer)
}
```

Use `onComplete` to chain actions — the engine calls it when the animation finishes, so timing is exact even across tab switches.

**`ApplyPattern` signature:**

```ts
type ApplyPattern = (pattern: GridPattern, durationOrOptions?: number | ApplyOptions) => void
```

**`ApplyOptions`:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `duration` | `number` | `10000` | Transition duration (ms) |
| `easing` | `(t: number) => number` | default easing | Easing curve |
| `absolute` | `boolean` | `false` | Raw target angles (for multi-revolution spin) |
| `onComplete` | `() => void` | — | Called when the action finishes |
| `stagger` | `StaggerFn` | — | Per-clock delay |
| `spinRevolutions` | `number` | — | Enables spin reveal mode |
| `spinDirection` | `'clockwise' \| 'counterclockwise' \| 'opposite'` | `'clockwise'` | Spin direction |
| `revolutionDuration` | `number` | `10000` | Duration of one revolution |

## Patterns

A `GridPattern` is an 8-row × 20-column 2D array where each cell is a `ClockState` — a tuple of two angles in degrees (`[hand1, hand2]`). `0°` is 12 o'clock, `90°` is 3 o'clock, `180°` is 6 o'clock, `270°` is 9 o'clock.

### Built-in Patterns

All 14 patterns are individually exported and available as the `ALL_PATTERNS` array:

```tsx
import {
  NOON, RADIAL, CONVERGE, CHECKERBOARD, WAVE, VORTEX,
  RINGS, CONCENTRIC_RECTS, CROSS_STITCH,
  BLOOM, CHEVRONS, SPIRAL_ARMS, WINDMILL, INWARD,
  ALL_PATTERNS,
  randomPattern,
} from 'clockboard'
```

| Pattern | Description |
|---------|-------------|
| `NOON` | All hands at 12 o'clock |
| `RADIAL` | Hands radiate outward from grid center |
| `CONVERGE` | All hands point inward toward center |
| `CHECKERBOARD` | Alternating vertical and horizontal bars |
| `WAVE` | Sine wave undulating across columns |
| `VORTEX` | Radial direction twisted by distance |
| `RINGS` | Concentric rings from center |
| `CONCENTRIC_RECTS` | Rectangular borders from edge to center |
| `CROSS_STITCH` | Alternating X and + shapes |
| `BLOOM` | Hands splay wider with distance from center |
| `CHEVRONS` | Rows of V-shapes alternating direction |
| `SPIRAL_ARMS` | Twisted V-shapes following a spiral |
| `WINDMILL` | 2×2 repeating windmill |
| `INWARD` | Both hands pointing toward grid center, stacked |
| `randomPattern()` | Unique random angles each call |

`SYMMETRIC_STARTS` is a curated list of patterns suitable as spin starting positions: `NOON`, vertical line, horizontal line, and `INWARD`.

### Time Composition

```tsx
import { ClockBoard, composeTime } from 'clockboard'

<ClockBoard pattern={composeTime(14, 30)} />
```

### Custom Patterns

The `grid` helper creates a `GridPattern` from a function called for each clock position. `CENTER_COL` and `CENTER_ROW` provide the grid center coordinates.

```tsx
import { grid, CENTER_COL, CENTER_ROW } from 'clockboard'

const converge = grid((row, col) => {
  const angle = Math.atan2(CENTER_COL - col, row - CENTER_ROW) * (180 / Math.PI)
  return [angle, angle]
})

<ClockBoard pattern={converge} duration={0} />
```

| Export | Value | Description |
|--------|-------|-------------|
| `COLS` | `20` | Grid columns |
| `ROWS` | `8` | Grid rows |
| `CENTER_COL` | `9.5` | Horizontal center of the grid |
| `CENTER_ROW` | `3.5` | Vertical center of the grid |

### Easing

The default easing is a trapezoidal profile — ramp up, constant speed cruise, ramp down. Use `trapezoid(edge)` to create custom profiles where `edge` is the fraction of time spent in each ramp (0–0.5):

```tsx
import { trapezoid } from 'clockboard'

trapezoid(0.30) // 30% ramp, 40% cruise (default)
trapezoid(0.10) // 10% ramp, 80% cruise (spin default)
trapezoid(0.05) // 5% ramp, 90% cruise (near-linear)
```

### Random Utilities

Helpers for building custom generative behaviors:

```tsx
import { pick, pickExcept, weightedPick, randInt, randFloat } from 'clockboard'

pick([1, 2, 3])              // random item
pickExcept([1, 2, 3], 2)     // random item, not 2
weightedPick(['a', 'b'], [0.7, 0.3])  // weighted random
randInt(1, 10)               // integer in [1, 10]
randFloat(0, 1)              // float in [0, 1)
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
<ClockBoard behavior={alive()} boardColor="#0f3460" handColor="#16213e" />
<ClockBoard pattern={RADIAL} boardColor="#222" faceColor="#333" />
```

## Types

```tsx
import type {
  ClockState,      // [hand1: number, hand2: number]
  GridPattern,     // ClockState[][] (8 rows × 20 cols)
  ApplyOptions,    // { duration?, easing?, absolute?, onComplete?, stagger?, spinRevolutions?, spinDirection?, revolutionDuration? }
  ApplyPattern,    // (pattern: GridPattern, durationOrOptions?: number | ApplyOptions) => void
  Behavior,        // (apply: ApplyPattern) => () => void
  SequenceStep,    // { pattern, duration?, hold?, easing?, absolute?, stagger?, spinRevolutions?, spinDirection?, revolutionDuration? }
  SpinOptions,     // { start?, revolutions?, opposite?, revolutionDuration?, easing?, stagger? }
  StaggerFn,       // (row: number, col: number) => number
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

### 1.0.0
- Complete animation engine overhaul
- New default behavior: `aliveTime()` — generative moods with reactive time display
- Spin animations with per-clock stagger and spin reveal transitions
- `sequence()` / `loop()` compositors for declarative behavior building
- Preset behaviors: `concentricDance()`, `gentleDrift()`, `waveSpin()`, `concentricSpin()`
- 14 built-in patterns including `INWARD`
- Trapezoidal easing, custom easing support, per-action easing overrides

### 0.1.0
- Overhauled animation engine for reliable, uninterrupted transitions
- Fixed animation timing when tab loses focus or window is backgrounded
- Added gradient support for `boardColor`
- Fixed resizing issues

### 0.0.1
- Initial release

## License

MIT
