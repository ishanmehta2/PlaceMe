import React from 'react'

interface AxisProps {
  labels: {
    top: string
    bottom: string
    left: string
    right: string
  }
  labelColors?: {
    top?: string
    bottom?: string
    left?: string
    right?: string
  }
  backgroundColor?: string
  size?: number
  children?: React.ReactNode
}

export default function Axis({
  labels,
  labelColors = {},
  backgroundColor = '#E0E7FF',
  size = 300,
  children,
}: AxisProps) {
  // Padding from edge for labels
  const pad = Math.round(size * 0.06)
  const baseLabelStyle = {
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '4px 12px',
    fontSize: Math.round(size * 0.11),
    fontWeight: 800,
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    lineHeight: 1.1,
    whiteSpace: 'nowrap' as const,
    color: 'black',
    background: 'rgba(255,255,255,0.95)',
  }

  // Container size includes space for labels
  const containerSize = size + 80 // Add extra space for labels

  return (
    <div className="relative" style={{ width: containerSize, height: containerSize }}>
      {/* Grid container */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: size,
          height: size,
          backgroundColor: 'white',
          transform: 'translate(-50%, -50%)',
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
        }}
      >
        {/* Axis lines */}
        <div
          className="absolute left-1/2 top-0 h-full"
          style={{
            width: '3px',
            backgroundColor: 'black',
            transform: 'translateX(-50%)',
            zIndex: 1,
          }}
        />
        <div
          className="absolute top-1/2 left-0 w-full"
          style={{
            height: '3px',
            backgroundColor: 'black',
            transform: 'translateY(-50%)',
            zIndex: 1,
          }}
        />
        {/* Children (draggables, etc.) */}
        {children}
      </div>

      {/* Axis labels - positioned outside the grid */}
      {/* Top */}
      <div
        className="absolute left-1/2"
        style={{
          ...baseLabelStyle,
          top: 0,
          transform: 'translateX(-50%)',
          background: labelColors.top || 'rgba(255,255,255,0.85)',
        }}
      >
        {labels.top}
      </div>
      {/* Bottom */}
      <div
        className="absolute left-1/2"
        style={{
          ...baseLabelStyle,
          bottom: 0,
          transform: 'translateX(-50%)',
          background: labelColors.bottom || 'rgba(255,255,255,0.85)',
        }}
      >
        {labels.bottom}
      </div>
      {/* Left */}
      <div
        className="absolute top-1/2"
        style={{
          ...baseLabelStyle,
          left: 0,
          writingMode: 'vertical-lr',
          textOrientation: 'mixed',
          background: labelColors.left || 'rgba(255,255,255,0.85)',
          transformOrigin: 'center',
          transform: 'translateY(-50%) rotate(180deg)',
        }}
      >
        {labels.left}
      </div>
      {/* Right */}
      <div
        className="absolute top-1/2"
        style={{
          ...baseLabelStyle,
          right: 0,
          transform: 'translateY(-50%)',
          writingMode: 'vertical-lr',
          textOrientation: 'mixed',
          background: labelColors.right || 'rgba(255,255,255,0.85)',
        }}
      >
        {labels.right}
      </div>
    </div>
  )
} 