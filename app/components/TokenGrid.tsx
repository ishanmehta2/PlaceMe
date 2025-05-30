import { DndContext } from '@dnd-kit/core'
import { DraggableToken } from './DraggableToken'
import Axis from './Axis'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import { useState, useEffect } from 'react'
import { DEFAULTS } from '../utils/constants'

interface Position {
  x: number
  y: number
}

interface Token {
  id: string
  position: Position
  userAvatar: string
  firstName: string
}

interface TokenGridProps {
  tokens: Token[]
  onPositionChange?: (tokenId: string, position: Position) => void
  onPlacementChange?: (allPlaced: boolean) => void
  axisLabels: {
    top: string
    bottom: string
    left: string
    right: string
  }
  axisColors: {
    top: string
    bottom: string
    left: string
    right: string
  }
  axisWidth?: number
  axisHeight?: number
  neutralZoneHeight?: number
}

const DEFAULT_AXIS_WIDTH = 300
const DEFAULT_AXIS_HEIGHT = 300
const DEFAULT_NEUTRAL_ZONE_HEIGHT = 100
const TOKEN_SIZE = 35

export function TokenGrid({ 
  tokens, 
  onPositionChange,
  onPlacementChange,
  axisLabels, 
  axisColors,
  axisWidth = DEFAULTS.AXIS_WIDTH,
  axisHeight = DEFAULTS.AXIS_HEIGHT,
  neutralZoneHeight = DEFAULTS.NEUTRAL_ZONE_HEIGHT
}: TokenGridProps) {
  // Initialize positions from tokens
  const initialPositions = tokens.reduce((acc, token) => ({
    ...acc,
    [token.id]: token.position
  }), {})

  const {
    positions,
    activeId,
    gridRef,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  } = useDragAndDrop(initialPositions, axisHeight, neutralZoneHeight)

  // Track placed tokens
  const [placedTokens, setPlacedTokens] = useState<Set<string>>(new Set())

  // Update placed tokens when positions change
  useEffect(() => {
    const newPlacedTokens = new Set<string>()
    Object.entries(positions).forEach(([tokenId, position]) => {
      // Token is considered placed if it's completely within the axis area
      // Check if the bottom edge of the token (y + TOKEN_SIZE/2) is within the axis height
      if (position.y + DEFAULTS.TOKEN_SIZE/2 <= axisHeight) {
        newPlacedTokens.add(tokenId)
      }
    })
    setPlacedTokens(newPlacedTokens)
    
    // Notify parent if all tokens are placed
    if (onPlacementChange) {
      onPlacementChange(newPlacedTokens.size === tokens.length)
    }
  }, [positions, axisHeight, tokens.length, onPlacementChange])

  // Notify parent of position changes
  const handleDragEndWithCallback = (event: any) => {
    handleDragEnd(event)
    if (onPositionChange && event.active) {
      const tokenId = event.active.id
      const position = positions[tokenId]
      onPositionChange(tokenId, position)
    }
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndWithCallback}
      onDragCancel={handleDragCancel}
    >
      <div 
        ref={gridRef} 
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: axisWidth,
          height: axisHeight + neutralZoneHeight + 8, // Add 8px for margin
          padding: '0px'
        }}
      >
        <Axis
          width={axisWidth}
          height={axisHeight}
          labels={axisLabels}
          labelColors={axisColors}
        />
        {tokens.map(token => {
          const pos = positions[token.id];
          if (!pos) return null;
          return (
            <DraggableToken
              key={token.id}
              id={token.id}
              position={pos}
              isDragging={activeId === token.id}
              userAvatar={token.userAvatar}
              firstName={token.firstName}
              gridWidth={axisWidth}
              gridHeight={axisHeight}
              neutralZoneHeight={neutralZoneHeight}
              isPlaced={placedTokens.has(token.id)}
            />
          );
        })}
        <div 
          className="w-full bg-[#FFE082]"
          style={{ 
            height: neutralZoneHeight,
            marginTop: '8px',
            borderRadius: '24px',
            overflow: 'hidden'
          }}
        />
      </div>
    </DndContext>
  )
} 