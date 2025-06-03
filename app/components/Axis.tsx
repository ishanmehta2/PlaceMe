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
  size?: number
  tokenSize?: number
  children?: React.ReactNode
  tokens?: TokenProps[]
}

export default function Axis({
  labels,
  labelColors = {},
  backgroundColor = '#E0E7FF',
  size: maxSize = 300,
  tokenSize = 35,
  children,
  tokens = [],
}: AxisProps) {
  const [currentSize, setCurrentSize] = useState(maxSize)

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      // Calculate size based on screen width, with a minimum of 250px and maximum of maxSize
      const calculatedSize = Math.min(Math.max(width * 0.85, 250), maxSize)
      setCurrentSize(calculatedSize)
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [maxSize])

  // Convert percentage positions to pixel positions
  const scaledTokens = tokens.map(token => ({
    ...token,
    x: token.x * (currentSize - tokenSize) + tokenSize/2, // Convert from [0,1] to [0,size-tokenSize]
    y: token.y * (currentSize - tokenSize) + tokenSize/2,
  }))

  // Padding from edge for labels
  const pad = Math.round(currentSize * 0.06)
  const baseLabelStyle = {
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '4px 12px',
    fontSize: Math.max(10, Math.round(currentSize * 0.05)), // 5% of size, min 10px
    fontWeight: 800,
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    lineHeight: 1.1,
    whiteSpace: 'nowrap' as const,
    color: 'black',
    background: 'rgba(255,255,255,0.95)',
    overflow: 'hidden',
    maxWidth: '100%',
  }

  // Calculate font size based on text length and container size
  const calculateFontSize = (text: string, isVertical: boolean = false) => {
    const baseSize = Math.max(10, Math.round(currentSize * 0.07));
    // Calculate available space - account for padding and container size
    const availableSpace = currentSize * 0.8; // 60% of container size
    const avgCharWidth = baseSize * 0.6; // Approximate width of a character
    const maxChars = Math.floor(availableSpace / avgCharWidth);
    const length = text.length;
    
    if (length <= maxChars) return baseSize;
    
    // Reduce font size proportionally to text length
    const reductionFactor = Math.min(1, maxChars / length);
    return Math.max(10, Math.round(baseSize * reductionFactor));
  }

  return (
    <div className="relative w-full flex justify-center" style={{ height: currentSize }}>
      <div className="relative" style={{ width: currentSize, height: currentSize }}>
        {/* Grid container */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: currentSize,
            height: currentSize,
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
          {scaledTokens.map((token) => (
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
              fontSize: calculateFontSize(labels.top),
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
              fontSize: calculateFontSize(labels.bottom),
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
              fontSize: calculateFontSize(labels.left, true),
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
              fontSize: calculateFontSize(labels.right, true),
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