'use client'

import { useState, useRef } from 'react'
import { DndContext, useDraggable, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import Axis from '../components/Axis'

function DraggableToken({ id, position, gridSize, tokenSize }: any) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
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
        height: tokenSize,
        zIndex: isDragging ? 10 : 1,
        cursor: 'grab',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: isDragging ? 'scale(1.2)' : 'scale(1)',
        filter: isDragging ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))' : 'none',
      }}
    >
      <img
        src={`https://randomuser.me/api/portraits/${position.name === 'Sarah' ? 'women' : 'men'}/${parseInt(position.id.replace('token', '')) * 10}.jpg`}
        alt="Avatar"
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          border: '2px solid ' + position.color,
          boxShadow: isDragging ? '0 2px 4px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.1)',
        }}
      />
      <span style={{
        marginTop: '2px',
        fontSize: '12px',
        fontWeight: 600,
      }}>{position.name}</span>
    </div>
  )
}

export default function DraggableTokenPage() {
  const [positions, setPositions] = useState([
    { id: 'token1', x: 100, y: 100, color: '#3B82F6', name: 'Nils' },
    { id: 'token2', x: 150, y: 150, color: '#EF4444', name: 'Sarah' },
    { id: 'token3', x: 200, y: 100, color: '#10B981', name: 'Alex' },
    { id: 'token4', x: 100, y: 200, color: '#8B5CF6', name: 'Jordan' },
  ])
  const gridSize = 300
  const tokenSize = 28

  // Configure sensors for both mouse and touch
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // 5px movement before drag starts
    },
  })
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100, // 100ms delay before drag starts
      tolerance: 5, // 5px movement tolerance
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor)

  // Handle drag end to update position
  const handleDragEnd = (event: any) => {
    const { active, delta } = event
    if (delta) {
      setPositions(positions.map(pos => {
        if (pos.id === active.id) {
          let newX = pos.x + delta.x
          let newY = pos.y + delta.y
          // Clamp to grid bounds
          newX = Math.max(0, Math.min(newX, gridSize - tokenSize))
          newY = Math.max(0, Math.min(newY, gridSize - tokenSize))
          return { ...pos, x: newX, y: newY }
        }
        return pos
      }))
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FFF8E1]">
      <div className="mb-8 text-2xl font-bold">Drag your token onto the axis!</div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <Axis
          labels={{
            top: 'Kinky',
            bottom: 'Vanilla',
            left: 'Sub',
            right: 'Dom',
          }}
          labelColors={{
            top: '#FFE5E5',
            bottom: '#E5FFFA',
            left: '#E5F6FF',
            right: '#F0FFE5',
          }}
          backgroundColor="white"
          size={gridSize}
        >
          {positions.map((pos) => (
            <DraggableToken
              key={pos.id}
              id={pos.id}
              position={pos}
              gridSize={gridSize}
              tokenSize={tokenSize}
            />
          ))}
        </Axis>
      </DndContext>
    </main>
  )
} 