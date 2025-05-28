import { useState, useRef } from 'react'
import { useDraggable, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import { positionUtils } from '../utils/positionUtils'

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
}

const DEFAULT_GRID_WIDTH = 300
const DEFAULT_GRID_HEIGHT = 300
const DEFAULT_NEUTRAL_ZONE_HEIGHT = 100
const TOKEN_SIZE = 35

export function useDragAndDrop(
  initialPositions: TokenPositions,
  gridHeight: number = DEFAULT_GRID_HEIGHT,
  neutralZoneHeight: number = DEFAULT_NEUTRAL_ZONE_HEIGHT
): DragAndDropState {
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
          
          // Use center-based clamping to match drag preview
          const clamped = positionUtils.clampToGrid(
            newX, 
            newY, 
            DEFAULT_GRID_WIDTH, 
            gridHeight, 
            TOKEN_SIZE,
            neutralZoneHeight
          )
          return {
            ...prev,
            [tokenId]: clamped
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

  return {
    positions,
    activeId,
    gridRef,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  }
} 