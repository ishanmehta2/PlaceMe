"use client"
import React from 'react'
import { tokenStyles } from '../styles/tokenStyles'
import { positionUtils } from '../utils/positionUtils'

export interface TokenProps {
  id: string
  name: string
  position: {
    x: number
    y: number
  }
  size: number
  color?: string
  imageUrl?: string
  isSelected?: boolean
  showTooltip?: boolean
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
  disablePositioning?: boolean
}

export default function Token({
  id,
  name,
  position,
  size,
  color = '#4F46E5',
  imageUrl,
  isSelected = false,
  showTooltip = true,
  onClick,
  className = '',
  style,
  disablePositioning = false,
}: TokenProps) {
  const { border, fontSize, imageSize } = positionUtils.calculateTokenSize(size)

  return (
    <div
      className={`absolute flex flex-col items-center ${className}`}
      style={{ ...tokenStyles.base, ...style }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          ...tokenStyles.container,
          width: size,
          height: size,
          border: `${border}px solid ${color}`,
          boxShadow: isSelected 
            ? '0 0 0 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)' 
            : '0 2px 4px rgba(0,0,0,0.2)',
          cursor: onClick ? 'pointer' : 'default',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.3s ease-in-out',
        }}
        title={showTooltip ? name : undefined}
        onClick={onClick}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            style={{
              ...tokenStyles.image,
              width: imageSize,
              height: imageSize,
            }}
          />
        )}
      </div>
      <div style={{ 
        ...tokenStyles.name, 
        fontSize,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {name.split(' ')[0]}
      </div>
    </div>
  )
} 