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
        // transform: 'translate(-50%, -50%)', // Center the token on its position
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
            : '0 2px 4px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.3s ease-in-out',
        }}
        title={showTooltip ? name : undefined}
        onClick={onClick}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            style={{ width: imageSize, height: imageSize, objectFit: 'cover', borderRadius: '50%' }}
          />
        ) : null}
      </div>
      <div
        className="mt-1 text-center"
        style={{ 
          fontWeight: isSelected ? 700 : 600, 
          fontSize, 
          color: '#222', 
          textShadow: '0 1px 2px #fff',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {name}
      </div>
    </div>
  )
} 