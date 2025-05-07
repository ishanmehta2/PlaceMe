'use client'

import { useState, useRef } from 'react'
import { DndContext, useDraggable } from '@dnd-kit/core'
import Axis from '../components/Axis'

function DraggableToken({ position, setPosition, gridSize, tokenSize }: any) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'token',
  })

  // Calculate the new position based on drag offset
  let x = position.x
  let y = position.y
  if (transform) {
    x += transform.x
    y += transform.y
    // Clamp to grid bounds
    x = Math.max(0, Math.min(x, gridSize - tokenSize))
    y = Math.max(0, Math.min(y, gridSize - tokenSize))
  }

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        nodeRef.current = el
      }}
      {...listeners}
      {...attributes}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: tokenSize,
        zIndex: isDragging ? 10 : 1,
        cursor: 'grab',
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
      }}
      className="flex flex-col items-center"
    >
      <img
        src="https://randomuser.me/api/portraits/men/32.jpg"
        alt="Avatar"
        className="w-12 h-12 rounded-full border-2 border-blue-500 shadow-lg"
      />
      <span className="mt-1 text-xs font-semibold">Nils</span>
    </div>
  )
}

export default function DraggableTokenPage() {
  // Initial position (center of grid)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const gridSize = 300
  const tokenSize = 120

  // Handle drag end to update position
  const handleDragEnd = (event: any) => {
    if (event.active.id === 'token' && event.delta) {
      let newX = position.x + event.delta.x
      let newY = position.y + event.delta.y
      // Clamp to grid bounds
      newX = Math.max(0, Math.min(newX, gridSize - tokenSize))
      newY = Math.max(0, Math.min(newY, gridSize - tokenSize))
      setPosition({ x: newX, y: newY })
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FFF8E1]">
      <div className="mb-8 text-2xl font-bold">Drag your token onto the axis!</div>
      <DndContext onDragEnd={handleDragEnd}>
        <Axis
          labels={{
            top: 'Kinky',
            bottom: 'Vanilla',
            left: 'Sub',
            right: 'Dom',
          }}
          backgroundColor="#E0E7FF"
          size={gridSize}
        >
          <DraggableToken
            position={position}
            setPosition={setPosition}
            gridSize={gridSize}
            tokenSize={tokenSize}
          />
        </Axis>
      </DndContext>
    </main>
  )
} 