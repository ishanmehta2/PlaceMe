import { useState, useRef } from 'react'
import { useDraggable, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'

interface Position {
  x: number
  y: number
}

interface TokenPositions {
  [tokenId: string]: Position
}

interface DragAndDropState {
  positions: TokenPositions
  activeId: string | null
  gridRef: React.RefObject<HTMLDivElement>
  sensors: ReturnType<typeof useSensors>
  handleDragStart: (event: any) => void
  handleDragEnd: (event: any) => void
  handleDragCancel: () => void
  updatePosition: (tokenId: string, position: Position) => void
}

const GRID_SIZE = 300
const TOKEN_SIZE = 35

export function useDragAndDrop(initialPositions: TokenPositions): DragAndDropState {
  const [positions, setPositions] = useState<TokenPositions>(initialPositions)
  const [activeId, setActiveId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>

  // Configure sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  )

  // Handle drag start
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, delta } = event
    if (delta && gridRef.current) {
      // Get the grid container (the white background div)
      const gridContainer = gridRef.current.querySelector('div[style*="background-color: white"]')
      if (gridContainer) {
        const gridRect = gridContainer.getBoundingClientRect()
        const containerRect = gridRef.current.getBoundingClientRect()
        
        // Calculate the offset between the container and the grid
        const offsetX = gridRect.left - containerRect.left
        const offsetY = gridRect.top - containerRect.top
        
        setPositions(prev => {
          const tokenId = active.id
          const currentPosition = prev[tokenId]
          
          let newX = currentPosition.x + delta.x
          let newY = currentPosition.y + delta.y
          
          // Clamp to grid bounds, accounting for token size and offset
          newX = Math.max(0, Math.min(newX, GRID_SIZE - TOKEN_SIZE))
          newY = Math.max(0, Math.min(newY, GRID_SIZE - TOKEN_SIZE))
          
          return {
            ...prev,
            [tokenId]: { x: newX, y: newY }
          }
        })
      }
    }
    setActiveId(null)
  }

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveId(null)
  }

  // Update position manually (useful for initialization or programmatic updates)
  const updatePosition = (tokenId: string, position: Position) => {
    setPositions(prev => ({
      ...prev,
      [tokenId]: position
    }))
  }

  return {
    positions,
    activeId,
    gridRef,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    updatePosition
  }
} 