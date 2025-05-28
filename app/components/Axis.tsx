'use client'

import React, { useEffect, useState } from 'react'
import Token, { TokenProps } from './Token'

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
  width?: number
  height?: number
  tokenSize?: number
  children?: React.ReactNode
  tokens?: TokenProps[]
}

export default function Axis({
  labels,
  labelColors = {},
  backgroundColor = '#E0E7FF',
  width: maxWidth = 300,
  height: maxHeight = 300,
  tokenSize = 35,
  children,
  tokens = [],
}: AxisProps) {
  const [currentWidth, setCurrentWidth] = useState(maxWidth)
  const [currentHeight, setCurrentHeight] = useState(maxHeight)

  useEffect(() => {
    const updateSize = () => {
      const windowWidth = window.innerWidth
      // Calculate size based on screen width, with a minimum of 250px and maximum of maxWidth/maxHeight
      const calculatedWidth = Math.min(Math.max(windowWidth * 0.85, 250), maxWidth)
      const calculatedHeight = Math.min(Math.max(windowWidth * 0.85, 250), maxHeight)
      setCurrentWidth(calculatedWidth)
      setCurrentHeight(calculatedHeight)
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [maxWidth, maxHeight])

  // Padding from edge for labels
  const pad = Math.round(Math.min(currentWidth, currentHeight) * 0.06)
  const baseLabelStyle = {
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '4px 12px',
    fontSize: Math.max(12, Math.round(Math.min(currentWidth, currentHeight) * 0.07)), // 7% of size, min 12px
    fontWeight: 800,
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    lineHeight: 1.1,
    whiteSpace: 'nowrap' as const,
    color: 'black',
    background: 'rgba(255,255,255,0.95)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  // Container size includes space for labels
  const containerWidth = currentWidth
  const containerHeight = currentHeight

  return (
    <div className="relative w-full flex justify-center" style={{ height: containerHeight }}>
      <div className="relative" style={{ width: containerWidth, height: containerHeight }}>
        {/* Grid container */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: currentWidth,
            height: currentHeight,
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
          
          {/* Tokens */}
          {tokens.map((token) => (
            <Token
              key={token.id}
              {...token}
              size={tokenSize}
            />
          ))}
          
          {/* Children (draggables, etc.) */}
          {children}

          {/* Axis labels - positioned inside the grid */}
          {/* Top */}
          <div
            className="absolute left-1/2"
            style={{
              ...baseLabelStyle,
              top: 0,
              transform: 'translateX(-50%)',
              background: labelColors.top || 'rgba(255,255,255,0.85)',
              zIndex: 2,
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
              zIndex: 2,
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
              padding: '12px 4px',
              zIndex: 2,
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
              padding: '12px 4px',
              zIndex: 2,
            }}
          >
            {labels.right}
          </div>
        </div>
      </div>
    </div>
  )
} 