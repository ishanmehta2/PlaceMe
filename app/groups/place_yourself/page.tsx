'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext } from '@dnd-kit/core'
import { useUserData } from '../../hooks/useUserData'
import { useGroupWorkflow } from '../../hooks/useGroupWorkflow'
import { useDragAndDrop } from '../../hooks/useDragAndDrop'
import { DraggableToken } from '../../components/DraggableToken'
import Axis from '../../components/Axis'

// Constants for sizing
const AXIS_SIZE = 300
const TOKEN_SIZE = 35

export default function PlaceYourself() {
  const router = useRouter()
  const { userName, firstName, userAvatar, loading: userLoading, error: userError } = useUserData()
  const { 
    loading, 
    error, 
    userGroups, 
    selectedGroup, 
    initializeWorkflow, 
    saveSelfPlacement 
  } = useGroupWorkflow()
  
  const [isSaving, setIsSaving] = useState(false)
  
  // Start at center of grid, accounting for token size
  const initialPositions = { 
    'user-token': { 
      x: (AXIS_SIZE - TOKEN_SIZE) / 2, 
      y: (AXIS_SIZE - TOKEN_SIZE) / 2 
    }
  }
  
  const {
    positions,
    activeId,
    gridRef,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  } = useDragAndDrop(initialPositions)

  // Initialize workflow on component mount
  useEffect(() => {
    initializeWorkflow()
  }, [])

  // Proceed to place others
  const handleNext = async () => {
    if (!selectedGroup || !userName || !firstName) {
      setError?.('Missing required information. Please try again.')
      return
    }

    try {
      setIsSaving(true)
      
      const userPosition = positions['user-token']
      await saveSelfPlacement(userPosition, userName, firstName)
      
      // Navigate to place_others
      router.push('/groups/place_others')
    } catch (err: any) {
      console.error('Error saving position:', err)
      setError?.(err.message || 'Failed to save your preferences')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || userLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  if (error || userError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
          {error || userError}
        </div>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Go Back Home
        </button>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm">
        {/* Debug: Show selected group */}
        {selectedGroup && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg mb-2">Selected Group:</h3>
            <div className="flex justify-between items-center">
              <span className="font-medium">{selectedGroup.name}</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                RANDOMLY SELECTED
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              From your {userGroups.length} group{userGroups.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            PLACE YOURSELF
          </h1>
        </div>
        
        <div className="space-y-6">
          <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div ref={gridRef} className="relative">
              <Axis
                size={AXIS_SIZE}
                labels={{
                  top: 'Wet Sock',
                  bottom: 'Dry Tongue',
                  left: 'Tree Hugger',
                  right: 'Lumberjack'
                }}
                labelColors={{
                  top: 'rgba(251, 207, 232, 0.95)', // Pink
                  bottom: 'rgba(167, 243, 208, 0.95)', // Green
                  left: 'rgba(221, 214, 254, 0.95)', // Purple
                  right: 'rgba(253, 230, 138, 0.95)' // Yellow
                }}
              >
                <DraggableToken
                  id="user-token"
                  position={positions['user-token']}
                  isDragging={activeId === 'user-token'}
                  userAvatar={userAvatar}
                  firstName={firstName}
                />
              </Axis>
            </div>
          </DndContext>
        </div>
        
        {/* Next Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleNext}
            disabled={isSaving || !selectedGroup}
            className="bg-[#60A5FA] py-3 px-10 rounded-full disabled:opacity-50"
          >
            <span className="text-xl font-black" style={{ 
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              color: 'white',
              fontFamily: 'Arial, sans-serif'
            }}>
              {isSaving ? 'Saving...' : 'Next'}
            </span>
          </button>
        </div>
      </div>
    </main>
  )
}