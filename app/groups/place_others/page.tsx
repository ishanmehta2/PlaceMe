'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '../../hooks/useUserData'
import { useGroupWorkflow } from '../../hooks/useGroupWorkflow'
import { useDailyAxis } from '../../hooks/useDailyAxis'
import { TokenGrid } from '../../components/TokenGrid'

export default function PlaceOthers() {
  const router = useRouter()
  const { userName, firstName, userAvatar, loading: userLoading, error: userError } = useUserData()
  const { 
    loading, 
    error, 
    selectedGroup, 
    tokens, 
    getWorkflowGroup, 
    handlePositionChange, 
    saveOthersPlacement 
  } = useGroupWorkflow()
  
  const { dailyAxis, loading: axisLoading, error: axisError } = useDailyAxis(selectedGroup?.id || null)
  
  const [isSaving, setIsSaving] = useState(false)

  // Get the workflow group on component mount
  useEffect(() => {
    getWorkflowGroup()
  }, [])

  // Handle next button
  const handleNext = async () => {
    if (!dailyAxis) {
      console.error('Daily axis is not available')
      return
    }

    try {
      setIsSaving(true)
      console.log('🎯 Saving others placement with dailyAxis:', dailyAxis)
      await saveOthersPlacement(dailyAxis)
      router.push('/groups/results')
    } catch (err: any) {
      console.error('Error saving positions:', err)
      // You could add error state here if needed
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
      <div className="w-full max-w-sm">
        {/* Show selected group info */}
        {selectedGroup && (
          <>
            {/* Header */}
            <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-4">
              <h1 className="text-4xl font-black text-center" style={{ 
                textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                color: 'white',
                fontFamily: 'Arial, sans-serif'
              }}>
                PLACE OTHERS
              </h1>
            </div>
            
            {/* Selected group info */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-700">{selectedGroup.name}</h2>
              <p className="text-sm text-gray-600">
                {tokens.length} member{tokens.length !== 1 ? 's' : ''} to place
              </p>
            </div>

            {tokens.length === 0 ? (
              <div className="text-center">
                <p className="text-lg mb-6">You're the only member in this group right now.</p>
                <button
                  onClick={() => router.push('/groups/results')}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg"
                >
                  Skip to Results
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  <TokenGrid
                    tokens={tokens}
                    onPositionChange={handlePositionChange}
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
                  />
                </div>
                
                {/* Next Button */}
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleNext}
                    disabled={isSaving || !dailyAxis}
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
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}