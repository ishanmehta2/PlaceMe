import { DndContext } from '@dnd-kit/core'
import { DraggableToken } from './DraggableToken'
import Axis from './Axis'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import { useEffect } from 'react'

interface Position {
  x: number
  y: number
}

interface TokenPositions {
  [tokenId: string]: Position
}

interface Token {
  id: string
  firstName: string
  userAvatar: string
  position: Position
}

interface TokenGridProps {
  tokens: Token[]
  onPositionChange?: (tokenId: string, position: Position) => void
  onPlacementStatusChange?: (hasUnplacedTokens: boolean) => void
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
}

const GRID_SIZE = 300

export function TokenGrid({ tokens, onPositionChange, onPlacementStatusChange, axisLabels, axisColors }: TokenGridProps) {
  // Initialize positions from tokens
  const initialPositions: TokenPositions = tokens.reduce((acc, token) => ({
    ...acc,
    [token.id]: token.position || { x: 0.5, y: 0.5 } // Default to center if no position
  }), {})

  const {
    positions,
    activeId,
    gridRef,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  } = useDragAndDrop(initialPositions)

  // Check for unplaced tokens
  useEffect(() => {
    const hasUnplacedTokens = tokens.some(token => {
      const currentPos = positions[token.id]
      const initialPos = initialPositions[token.id]
      // A token is considered placed if it has moved from its initial position
      const isPlaced = Math.abs(currentPos.x - initialPos.x) > 0.01 || Math.abs(currentPos.y - initialPos.y) > 0.01
      return !isPlaced
    })
    onPlacementStatusChange?.(hasUnplacedTokens)
  }, [positions, tokens, initialPositions, onPlacementStatusChange])

  // Notify parent of position changes only on drag end
  const handleDragEndWithCallback = (event: any) => {
    handleDragEnd(event)
    if (onPositionChange && event.active) {
      const tokenId = event.active.id
      onPositionChange(tokenId, positions[tokenId])
    }
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndWithCallback}
      onDragCancel={handleDragCancel}
    >
      <div ref={gridRef} className="relative">
        <Axis
          size={GRID_SIZE}
          labels={axisLabels}
          labelColors={axisColors}
        >
          {tokens.map(token => {
            const currentPos = positions[token.id]
            const initialPos = initialPositions[token.id]
            // A token is considered placed if it has moved from its initial position
            const isPlaced = Math.abs(currentPos.x - initialPos.x) > 0.01 || Math.abs(currentPos.y - initialPos.y) > 0.01
            const isUnplaced = !isPlaced

            return (
              <DraggableToken
                key={token.id}
                id={token.id}
                position={positions[token.id]}
                isDragging={activeId === token.id}
                userAvatar={token.userAvatar}
                firstName={token.firstName}
                isUnplaced={isUnplaced}
              />
            )
          })}
        </Axis>
      </div>
    </DndContext>
  )
} 