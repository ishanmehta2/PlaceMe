"use client"
import React from 'react'

export interface TokenProps {
  id: string
  name: string
  x: number // pixel position
  y: number // pixel position
  color?: string
  size?: number
  showTooltip?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
  imageUrl?: string
  isSelected?: boolean
  isUnplaced?: boolean
}

export default function Token({
  id,
  name,
  x,
  y,
  color = '#4F46E5',
  size = 56,
  showTooltip = true,
  onClick,
  className = '',
  imageUrl,
  isSelected = false,
  isUnplaced = false,
}: TokenProps) {
  const border = Math.max(4, Math.round(size * 0.13)) // 13% of size, min 4px
  const fontSize = Math.max(14, Math.round(size * 0.36)) // 36% of size, min 14px
  const imageSize = size - border * 2

  return (
    <div
      className={`absolute flex flex-col items-center ${className}`}
      style={{ 
        left: x,
        top: y,
        zIndex: 2,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: '#fffbe6',
          borderRadius: '50%',
          border: `${border}px solid ${color}`,
          boxShadow: isSelected 
            ? '0 0 0 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)' 
            : isUnplaced
              ? '0 0 0 4px rgba(156, 163, 175, 0.3), 0 2px 4px rgba(0,0,0,0.1)'
              : '0 2px 4px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.3s ease-in-out',
          opacity: isUnplaced ? 0.8 : 1,
        }}
        title={showTooltip ? name : undefined}
        onClick={onClick}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            style={{ 
              width: imageSize, 
              height: imageSize, 
              objectFit: 'cover', 
              borderRadius: '50%',
              filter: isUnplaced ? 'grayscale(50%)' : 'none'
            }}
          />
        ) : null}
      </div>
      <div
        className="mt-1 text-center"
        style={{ 
          fontWeight: isSelected ? 700 : 600, 
          fontSize, 
          color: isUnplaced ? '#6B7280' : '#222', 
          textShadow: '0 1px 2px #fff',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {name}
      </div>
    </div>
  )
} 