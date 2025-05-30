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
  
  // Updated: useDailyAxis now loads the existing daily axes for this group
  const { dailyAxis, loading: axisLoading, error: axisError } = useDailyAxis(selectedGroup?.id || null)
  
  const [isSaving, setIsSaving] = useState(false)

  // Get the workflow group on component mount
  useEffect(() => {
    getWorkflowGroup()
  }, [])

  // Handle next button - UPDATED for new workflow
  const handleNext = async () => {
    if (!selectedGroup || !dailyAxis) {
      console.error('Missing required group or axis information')
      return
    }

    try {
      setIsSaving(true)
      console.log('💾 Saving others placement with daily axis:', dailyAxis.id)
      
      // Updated: saveOthersPlacement no longer needs additional parameters
      await saveOthersPlacement(dailyAxis)
      router.push('/groups/results')
    } catch (err: any) {
      console.error('Error saving positions:', err)
      // You could add error state here if needed
    } finally {
      setIsSaving(false)
    }
  }

  // Handle back button to place_yourself
  const handleBack = () => {
    router.push('/groups/place_yourself')
  }

  // Loading state - wait for all required data
  if (loading || userLoading || axisLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
        {loading && <div className="text-sm text-gray-600 mt-2">Loading group...</div>}
        {axisLoading && <div className="text-sm text-gray-600 mt-2">Loading daily axes...</div>}
      </main>
    )
  }

  // Error state - show any errors that occurred
  if (error || userError || axisError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
          {error || userError || axisError}
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/groups/place_yourself')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            Start Over
          </button>
          <button
            onClick={() => router.push('/home')}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </main>
    )
  }

  // Missing group state
  if (!selectedGroup) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-2xl mb-4">
          No workflow group found. Please start from the beginning.
        </div>
        <button
          onClick={() => router.push('/groups/place_yourself')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Start Workflow
        </button>
      </main>
    )
  }

  // Missing axes state  
  if (!dailyAxis) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-2xl mb-4">
          No daily axes found for {selectedGroup.name}. Please start from place yourself.
        </div>
        <button
          onClick={() => router.push('/groups/place_yourself')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Go to Place Yourself
        </button>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm">
        {/* Selected group info - ENHANCED */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-lg mb-2">Current Workflow:</h3>
          <div className="flex justify-between items-center">
            <span className="font-medium">{selectedGroup.name}</span>
            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
              PLACE OTHERS
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {tokens.length} member{tokens.length !== 1 ? 's' : ''} to place
          </p>
          {/* Show axis info for debugging */}
          <div className="mt-2 text-xs text-gray-500">
            <div>Axis ID: {dailyAxis.id}</div>
            <div>Generated: {dailyAxis.date_generated}</div>
          </div>
        </div>

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

        {/* No other members case */}
        {tokens.length === 0 ? (
          <div className="text-center">
            <p className="text-lg mb-6">You're the only member in this group right now.</p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={handleBack}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={() => router.push('/groups/results')}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg"
              >
                Skip to Results
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Token Grid for placing others */}
            <div className="space-y-6">
              <TokenGrid
                tokens={tokens}
                onPositionChange={handlePositionChange}
                axisLabels={dailyAxis.labels}
                axisColors={dailyAxis.labels.labelColors}
              />
            </div>
            
            {/* Navigation Buttons - ENHANCED */}
            <div className="flex justify-center mt-8 space-x-4">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="bg-gray-500 text-white px-6 py-3 rounded-full hover:bg-gray-600 transition"
              >
                <span className="text-lg font-black" style={{ 
                  textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                  color: 'white',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  Back
                </span>
              </button>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={isSaving || !dailyAxis || !selectedGroup}
                className="bg-[#60A5FA] py-3 px-10 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3B82F6] transition"
              >
                <span className="text-xl font-black" style={{ 
                  textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                  color: 'white',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  {isSaving 
                    ? 'Saving...' 
                    : !dailyAxis 
                      ? 'Loading Axis...' 
                      : 'Next'
                  }
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}