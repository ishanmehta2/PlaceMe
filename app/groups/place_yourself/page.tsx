'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext } from '@dnd-kit/core'
import { useUserData } from '../../hooks/useUserData'
import { useGroupWorkflow } from '../../hooks/useGroupWorkflow'
import { useDragAndDrop } from '../../hooks/useDragAndDrop'
import { DraggableToken } from '../../components/DraggableToken'
import { useDailyAxis } from '../../hooks/useDailyAxis'
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
  
  const { dailyAxis, loading: axisLoading, error: axisError, saveAxisToDatabase } = useDailyAxis(selectedGroup?.id || null)
  
  const [isSaving, setIsSaving] = useState(false)
  const [showHomeConfirm, setShowHomeConfirm] = useState(false)
  
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

  // Handle home button click with confirmation
  const handleHomeClick = () => {
    setShowHomeConfirm(true)
  }

  // Confirm navigation to home (losing current axes)
  const confirmGoHome = () => {
    setShowHomeConfirm(false)
    router.push('/home')
  }

  // Cancel home navigation
  const cancelGoHome = () => {
    setShowHomeConfirm(false)
  }

  // Proceed to place others
  const handleNext = async () => {
    if (!selectedGroup || !userName || !firstName) {
      setError?.('Missing required information. Please try again.')
      return
    }

    if (!dailyAxis) {
      setError?.('Daily axis is still loading. Please wait a moment and try again.')
      return
    }

    try {
      setIsSaving(true)
      
      const userPosition = positions['user-token']
      console.log('🎯 Saving with session-based dailyAxis:', dailyAxis)
      
      // Pass the saveAxisToDatabase function to saveSelfPlacement
      await saveSelfPlacement(userPosition, userName, firstName, dailyAxis, saveAxisToDatabase)
      
      // Navigate to place_others
      router.push('/groups/place_others')
    } catch (err: any) {
      console.error('Error saving position:', err)
      setError?.(err.message || 'Failed to save your preferences')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || userLoading || axisLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  if (error || userError || axisError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
          {error || userError || axisError}
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
    <>
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
                  labels={dailyAxis?.labels || {
                    top: 'Wet Sock',
                    bottom: 'Dry Tongue',
                    left: 'Tree Hugger',
                    right: 'Lumberjack'
                  }}
                  labelColors={dailyAxis?.labels.labelColors || {
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
          
          {/* Navigation Buttons */}
          <div className="flex justify-center mt-8 space-x-4">
            {/* Home Button */}
            <button
              onClick={handleHomeClick}
              className="bg-gray-500 text-white px-6 py-3 rounded-full hover:bg-gray-600 transition"
            >
              <span className="text-lg font-black" style={{ 
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                color: 'white',
                fontFamily: 'Arial, sans-serif'
              }}>
                Home
              </span>
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={isSaving || !selectedGroup || !dailyAxis}
              className="bg-[#60A5FA] py-3 px-10 rounded-full disabled:opacity-50"
            >
              <span className="text-xl font-black" style={{ 
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                color: 'white',
                fontFamily: 'Arial, sans-serif'
              }}>
                {isSaving ? 'Saving...' : !dailyAxis ? 'Loading Axis...' : 'Next'}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Popup */}
      {showHomeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-center">
              Leave Without Placing?
            </h3>
            <p className="text-gray-700 mb-6 text-center">
              You have not yet placed yourself. If you proceed to the home page, you will not be able to see these axes. Confirm?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelGoHome}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmGoHome}
                className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-red-600 transition"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}