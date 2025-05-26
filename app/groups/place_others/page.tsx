'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '../../hooks/useUserData'
import { useGroupMembers } from '../../hooks/useGroupMembers'
import { TokenGrid } from '../../components/TokenGrid'

export default function PlaceOthers() {
  const router = useRouter()
  const { userName, firstName, userAvatar, loading: userLoading, error: userError } = useUserData()
  const { 
    tokens, 
    loading, 
    error, 
    userGroups, 
    selectedGroup, 
    handlePositionChange, 
    savePositions 
  } = useGroupMembers()
  
  const [isSaving, setIsSaving] = useState(false)

  // Handle next button
  const handleNext = async () => {
    try {
      setIsSaving(true)
      await savePositions()
      router.push('/groups/results')
    } catch (err: any) {
      console.error('Error saving positions:', err)
      // You could add error state here if needed
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

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
          {error}
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
        {/* Debug: Show all groups */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-lg mb-2">All Your Groups:</h3>
          {userGroups.length > 0 ? (
            <ul className="space-y-2">
              {userGroups.map((group) => (
                <li key={group.id} className="flex justify-between items-center">
                  <span className="font-medium">{group.name}</span>
                  <span className="text-sm text-gray-600">({group.role})</span>
                  {selectedGroup?.id === group.id && (
                    <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                      SELECTED
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No groups found</p>
          )}
        </div>

        {/* Show selected group and place others interface */}
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
              <p className="text-xs text-blue-600 mt-1">
                (Randomly selected from your {userGroups.length} group{userGroups.length !== 1 ? 's' : ''})
              </p>
            </div>

            {(error || userError) && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
                {error || userError}
              </div>
            )}

            {tokens.length === 0 ? (
              <div className="text-center">
                <p className="text-lg mb-6">You're the only member in this group right now.</p>
                <button
                  onClick={() => router.push('/')}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg"
                >
                  Go Back Home
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  <TokenGrid
                    tokens={tokens}
                    onPositionChange={handlePositionChange}
                    axisLabels={{
                      top: 'Wet Sock',
                      bottom: 'Dry Tongue',
                      left: 'Tree Hugger',
                      right: 'Lumberjack'
                    }}
                    axisColors={{
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
                    disabled={isSaving}
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
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}