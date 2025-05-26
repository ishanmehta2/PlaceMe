import { DndContext } from '@dnd-kit/core'
import { DraggableToken } from './DraggableToken'
import Axis from './Axis'
import { useDragAndDrop } from '../hooks/useDragAndDrop'

interface Position {
  x: number
  y: number
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

export function TokenGrid({ tokens, onPositionChange, axisLabels, axisColors }: TokenGridProps) {
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
  } = useDragAndDrop(initialPositions)

  // Notify parent of position changes
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
          {tokens.map(token => (
            <DraggableToken
              key={token.id}
              id={token.id}
              position={positions[token.id]}
              isDragging={activeId === token.id}
              userAvatar={token.userAvatar}
              firstName={token.firstName}
            />
          ))}
        </Axis>
      </div>
    </DndContext>
  )
} 