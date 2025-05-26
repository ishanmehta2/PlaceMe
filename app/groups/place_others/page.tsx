'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '../../hooks/useUserData'
import { TokenGrid } from '../../components/TokenGrid'

interface Position {
  x: number
  y: number
}

interface UserToken {
  id: string
  firstName: string
  userAvatar: string
  position: Position
}

// Fake data for development
const FAKE_TOKENS: UserToken[] = [
  {
    id: 'user1',
    firstName: 'Janina',
    userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    position: { x: 75, y: 75 } // Top left
  },
  {
    id: 'user2',
    firstName: 'Nils',
    userAvatar: 'https://randomuser.me/api/portraits/men/15.jpg',
    position: { x: 225, y: 75 } // Top right
  },
  {
    id: 'user3',
    firstName: 'Melody',
    userAvatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    position: { x: 150, y: 225 } // Bottom center
  },
  {
    id: 'user4',
    firstName: 'Alex',
    userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    position: { x: 75, y: 225 } // Bottom left
  },
  {
    id: 'user5',
    firstName: 'Sarah',
    userAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    position: { x: 225, y: 225 } // Bottom right
  }
]

export default function PlaceOthers() {
  const router = useRouter()
  const { userName, firstName, userAvatar, loading: userLoading, error: userError } = useUserData()
  const [tokens, setTokens] = useState<UserToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simulate loading fake data
  useEffect(() => {
    const loadFakeData = async () => {
      try {
        setLoading(true)
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setTokens(FAKE_TOKENS)
      } catch (err: any) {
        console.error('Error loading fake data:', err)
        setError(err.message || 'Failed to load user positions')
      } finally {
        setLoading(false)
      }
    }

    loadFakeData()
  }, [])

  // Handle position changes
  const handlePositionChange = async (tokenId: string, position: Position) => {
    try {
      // Update local state
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.id === tokenId 
            ? { ...token, position }
            : token
        )
      )
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log(`Updated position for ${tokenId}:`, position)
    } catch (err: any) {
      console.error('Error updating position:', err)
      setError(err.message || 'Failed to update position')
    }
  }

  if (loading || userLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            PLACE OTHERS
          </h1>
        </div>
        
        {(error || userError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error || userError}
          </div>
        )}
        
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
            onClick={() => router.push('/groups/results')}
            className="bg-[#60A5FA] py-3 px-10 rounded-full"
          >
            <span className="text-xl font-black" style={{ 
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              color: 'white',
              fontFamily: 'Arial, sans-serif'
            }}>
              Next
            </span>
          </button>
        </div>
      </div>
    </main>
  )
}