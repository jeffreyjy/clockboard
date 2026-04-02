import { memo, useMemo } from 'react'
import type { Ref } from 'react'
import { CLOCK_COLOR, FACE_RADIUS, HAND_COLOR, HAND_WIDTH, CLOCK_FACE_INSET } from './config'

const MINUTE_H = Math.sqrt(FACE_RADIUS ** 2 - (HAND_WIDTH / 2) ** 2)
const HOUR_H   = MINUTE_H * 0.8
const HUB_R    = HAND_WIDTH / 2

export interface ClockProps {
  hand1Ref: Ref<SVGRectElement>
  hand2Ref: Ref<SVGRectElement>
  handColor?: string
  faceColor?: string
}

const cellStyle: React.CSSProperties = {
  position: 'relative',
  height: 0,
  paddingBottom: '100%',
}

const svgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
}

export const Clock = memo(function Clock({
  hand1Ref,
  hand2Ref,
  handColor = HAND_COLOR,
  faceColor = CLOCK_COLOR,
}: ClockProps) {
  const faceStyle = useMemo<React.CSSProperties>(() => ({
    position: 'absolute',
    inset: CLOCK_FACE_INSET,
    borderRadius: '50%',
    backgroundColor: faceColor,
    overflow: 'hidden',
  }), [faceColor])

  return (
    <div style={cellStyle}>
      <div style={faceStyle}>
        <svg viewBox="0 0 100 100" style={svgStyle}>
          <g transform="translate(50, 50)">
            <rect
              ref={hand2Ref}
              x={-HAND_WIDTH / 2}
              y={-HOUR_H}
              width={HAND_WIDTH}
              height={HOUR_H}
              fill={handColor}
            />
            <rect
              ref={hand1Ref}
              x={-HAND_WIDTH / 2}
              y={-MINUTE_H}
              width={HAND_WIDTH}
              height={MINUTE_H}
              fill={handColor}
            />
            <circle r={HUB_R} fill={handColor} />
          </g>
        </svg>
      </div>
    </div>
  )
})
