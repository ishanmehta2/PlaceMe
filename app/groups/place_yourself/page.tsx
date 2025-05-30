'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '../../hooks/useUserData'
import { useGroupWorkflow } from '../../hooks/useGroupWorkflow'
import { TokenGrid } from '../../components/TokenGrid'
import { useDailyAxis } from '../../hooks/useDailyAxis'
import { DEFAULTS } from '@/app/utils/constants'
import { positionUtils } from '@/app/utils/positionUtils'

// Constants for sizing
const AXIS_WIDTH = DEFAULTS.AXIS_WIDTH
const AXIS_HEIGHT = DEFAULTS.AXIS_HEIGHT
const NEUTRAL_ZONE_HEIGHT = DEFAULTS.NEUTRAL_ZONE_HEIGHT

export default function PlaceYourself() {
  const router = useRouter()
  const { userName, firstName, userAvatar, loading: userLoading, error: userError } = useUserData()
  const { 
    loading, 
    error: groupError, 
    selectedGroup, 
    initializeWorkflow, 
    saveSelfPlacement 
  } = useGroupWorkflow()
  
  const { dailyAxis, loading: axisLoading, error: axisError, saveAxisToDatabase } = useDailyAxis(selectedGroup?.id || null)
  
  const [isSaving, setIsSaving] = useState(false)
  const [showHomeConfirm, setShowHomeConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userPosition, setUserPosition] = useState({ x: AXIS_WIDTH / 2, y: AXIS_HEIGHT + (NEUTRAL_ZONE_HEIGHT / 2) })
  
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
      setError('Missing required information. Please try again.')
      return
    }

    if (!dailyAxis) {
      setError('Daily axis is still loading. Please wait a moment and try again.')
      return
    }

    try {
      setIsSaving(true)
      console.log('🎯 Saving with session-based dailyAxis:', dailyAxis)
      
      // Convert pixel position to percentage before saving
      const percentagePosition = positionUtils.pixelPositionToPercentage(userPosition.x, userPosition.y)
      
      // Pass the saveAxisToDatabase function to saveSelfPlacement
      await saveSelfPlacement(percentagePosition, userName, firstName, dailyAxis, saveAxisToDatabase)
      
      // Navigate to place_others
      router.push('/groups/place_others')
    } catch (err: any) {
      console.error('Error saving positions:', err)
      setError(err.message || 'Failed to save positions')
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
          onClick={() => router.push('/groups/place_yourself')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Start Over
        </button>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-[430px] flex flex-col items-center">
        {process.env.NODE_ENV === 'development' && (
          <div className="w-full mb-4 p-2 bg-gray-100 rounded text-xs text-left break-all">
            <strong>DEBUG:</strong>
            <pre>{JSON.stringify({
              userPosition,
              percentagePosition: positionUtils.pixelPositionToPercentage(userPosition.x, userPosition.y),
              userName,
              firstName,
              userAvatar,
              selectedGroup,
              dailyAxis
            }, null, 2)}</pre>
          </div>
        )}

        {selectedGroup && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg mb-2">Selected Group:</h3>
            <div className="flex justify-between items-center">
              <span className="font-medium">{selectedGroup.name}</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                RANDOMLY SELECTED
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-center w-full">
          <TokenGrid
            tokens={[{
              id: 'user-token',
              firstName: firstName || 'You',
              userAvatar: userAvatar || '',
              position: userPosition
            }]}
            onPositionChange={(_, position) => setUserPosition(position)}
            onPlacementChange={() => {}} // Not needed for single token
            axisLabels={dailyAxis?.labels || {
              top: 'Wet Sock',
              bottom: 'Dry Tongue',
              left: 'Tree Hugger',
              right: 'Lumberjack'
            }}
            axisColors={dailyAxis?.labels.labelColors || {
              top: 'rgba(251, 207, 232, 0.95)', // Pink
              bottom: 'rgba(167, 243, 208, 0.95)', // Green
              left: 'rgba(221, 214, 254, 0.95)', // Purple
              right: 'rgba(253, 230, 138, 0.95)' // Yellow
            }}
            axisWidth={AXIS_WIDTH}
            axisHeight={AXIS_HEIGHT}
            neutralZoneHeight={NEUTRAL_ZONE_HEIGHT}
          />
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
    </main>
  )
}