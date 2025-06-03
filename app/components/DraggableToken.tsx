import { useDraggable } from '@dnd-kit/core'
import Token from './Token'
import { useRef } from 'react'

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
  isUnplaced?: boolean
}

const TOKEN_SIZE = 35
const GRID_SIZE = 300
const DRAG_SCALE = 1.2
const DRAG_SHADOW = 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))'
const UNPLACED_ANIMATION = 'pulse 2s infinite'

export function DraggableToken({ id, position, isDragging, userAvatar, firstName, isUnplaced = false }: DraggableTokenProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  })
  const textRef = useRef<HTMLDivElement>(null)

  // Convert normalized position to pixels and add drag offset
  let x = position.x * GRID_SIZE
  let y = position.y * GRID_SIZE
  if (transform) {
    x += transform.x
    y += transform.y
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
        touchAction: 'none',
        transformOrigin: 'center center',
        animation: isUnplaced ? UNPLACED_ANIMATION : 'none',
      }}
    >
      <Token
        id={id}
        name={firstName}
        x={0}
        y={0}
        color={isUnplaced ? '#9CA3AF' : '#3B82F6'}
        size={TOKEN_SIZE}
        imageUrl={userAvatar}
        isUnplaced={isUnplaced}
        hideName={true}
      />
      <div
        ref={textRef}
        className="mt-1 text-center whitespace-nowrap"
        style={{
          position: 'absolute',
          left: '50%',
          top: '100%',
          transform: 'translateX(-50%)',
          fontSize: '14px',
          fontWeight: 600,
          color: isUnplaced ? '#6B7280' : '#222',
          textShadow: '0 1px 2px #fff',
          pointerEvents: 'none',
        }}
      >
        {firstName}
      </div>
    </div>
  )
} 