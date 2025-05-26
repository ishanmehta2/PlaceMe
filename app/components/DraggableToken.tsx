import { useDraggable } from '@dnd-kit/core'
import Token from './Token'

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
}

const TOKEN_SIZE = 35
const DRAG_SCALE = 1.2
const DRAG_SHADOW = 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))'

export function DraggableToken({ id, position, isDragging, userAvatar, firstName }: DraggableTokenProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  })

  // Calculate position with drag offset
  let x = position.x
  let y = position.y
  if (transform) {
    x += transform.x
    y += transform.y
    // Clamp to grid bounds, accounting for token size
    x = Math.max(0, Math.min(x, 300 - TOKEN_SIZE))
    y = Math.max(0, Math.min(y, 300 - TOKEN_SIZE))
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: TOKEN_SIZE,
        height: TOKEN_SIZE,
        zIndex: isDragging ? 10 : 1,
        cursor: 'grab',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        transform: isDragging ? `scale(${DRAG_SCALE})` : 'scale(1)',
        filter: isDragging ? DRAG_SHADOW : 'none',
        touchAction: 'none', // Prevent default touch actions
        transformOrigin: 'center center', // Ensure scaling happens from center
        marginLeft: `-${TOKEN_SIZE/2}px`, // Center the token on its position
        marginTop: `-${TOKEN_SIZE/2}px`, // Center the token on its position
      }}
    >
      <Token
        id={id}
        name={firstName}
        x={0}
        y={0}
        color="#3B82F6"
        size={TOKEN_SIZE}
        imageUrl={userAvatar}
      />
    </div>
  )
} 