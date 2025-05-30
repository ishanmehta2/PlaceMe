import { useDraggable } from '@dnd-kit/core'
import Token from './Token'
import { tokenStyles } from '../styles/tokenStyles'
import { positionUtils } from '../utils/positionUtils'
import { DEFAULTS } from '../utils/constants'

interface Position {
  x: number
  y: number
}

interface DraggableTokenProps {
  id: string
  position: Position
  isDragging: boolean
  userAvatar: string
  firstName: string
  gridWidth?: number
  gridHeight?: number
  neutralZoneHeight?: number
  isPlaced?: boolean
}

const DRAG_SCALE = 1.2
const DRAG_SHADOW = 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))'

export function DraggableToken({ 
  id, 
  position, 
  isDragging, 
  userAvatar, 
  firstName,
  gridWidth = DEFAULTS.AXIS_WIDTH,
  gridHeight = DEFAULTS.AXIS_HEIGHT,
  neutralZoneHeight = DEFAULTS.NEUTRAL_ZONE_HEIGHT,
  isPlaced = false
}: DraggableTokenProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  })

  // Calculate position with drag offset
  const newPosition = transform 
    ? positionUtils.clampToGrid(
        position.x + transform.x,
        position.y + transform.y,
        gridWidth,
        gridHeight,
        DEFAULTS.TOKEN_SIZE,
        neutralZoneHeight
      )
    : position

  const dragStyle = {
    ...tokenStyles.base,
    ...positionUtils.calculateTokenPosition(newPosition.x, newPosition.y, DEFAULTS.TOKEN_SIZE),
    cursor: 'grab',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    transform: isDragging ? `scale(${DRAG_SCALE})` : 'scale(1)',
    filter: isDragging ? DRAG_SHADOW : isPlaced ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' : 'none',
    touchAction: 'none',
    opacity: isPlaced ? 1 : 0.8,
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={dragStyle}
    >
      <Token
        id={id}
        name={firstName}
        position={{ x: 0, y: 0 }}
        size={DEFAULTS.TOKEN_SIZE}
        color={isPlaced ? "#3B82F6" : "#94A3B8"}
        imageUrl={userAvatar}
        disablePositioning
      />
    </div>
  )
} 