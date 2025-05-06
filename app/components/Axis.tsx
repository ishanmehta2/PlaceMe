import React from 'react'

interface AxisProps {
  labels: {
    top: string
    bottom: string
    left: string
    right: string
  }
  backgroundColor?: string
  size?: number
  children?: React.ReactNode
}

export default function Axis({
  labels,
  backgroundColor = '#E0E7FF',
  size = 300,
  children,
}: AxisProps) {
  // Padding from edge for labels
  const pad = Math.round(size * 0.06)
  const labelStyle = {
    background: 'rgba(255,255,255,0.85)',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    padding: '2px 10px',
    fontSize: Math.round(size * 0.09),
    fontWeight: 700,
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    lineHeight: 1.1,
    whiteSpace: 'nowrap' as const,
  }
  return (
    <div
      className="relative rounded-xl"
      style={{ width: size, height: size, backgroundColor }}
    >
      {/* Axis lines */}
      <div
        className="absolute left-1/2 top-0 h-full w-0.5 bg-black"
        style={{ transform: 'translateX(-50%)' }}
      />
      <div
        className="absolute top-1/2 left-0 w-full h-0.5 bg-black"
        style={{ transform: 'translateY(-50%)' }}
      />
      {/* Axis labels */}
      {/* Top */}
      <div
        className="absolute left-1/2"
        style={{
          ...labelStyle,
          top: pad,
          transform: 'translateX(-50%)',
        }}
      >
        {labels.top}
      </div>
      {/* Bottom */}
      <div
        className="absolute left-1/2"
        style={{
          ...labelStyle,
          bottom: pad,
          transform: 'translateX(-50%)',
        }}
      >
        {labels.bottom}
      </div>
      {/* Left (rotated) */}
      <div
        className="absolute top-1/2"
        style={{
          ...labelStyle,
          left: pad,
          transform: 'translateY(-50%) rotate(-12deg)',
        }}
      >
        {labels.left}
      </div>
      {/* Right (rotated) */}
      <div
        className="absolute top-1/2"
        style={{
          ...labelStyle,
          right: pad,
          transform: 'translateY(-50%) rotate(12deg)',
        }}
      >
        {labels.right}
      </div>
      {/* Children (draggables, etc.) */}
      {children}
    </div>
  )
} 