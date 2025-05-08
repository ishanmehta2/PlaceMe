'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'
import Axis from '../../components/Axis'
import Token from '../../components/Token'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'

// Constants for sizing
const AXIS_SIZE = 300
const TOKEN_SIZE = 35

// Hardcoded placeholder members for where others placed them
const PLACEHOLDER_PLACEMENTS = [
  { 
    user_id: 'placeholder-1', 
    username: 'Bob', 
    avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    color: '#EF4444',  // Red
    positions: [
      { x: 75, y: 25 }, // Someone placed them top right
      { x: 80, y: 20 }, // Another person placed them top right
      { x: 70, y: 30 }  // Another person placed them top right
    ]
  },
  { 
    user_id: 'placeholder-2', 
    username: 'Tim', 
    avatar_url: 'https://randomuser.me/api/portraits/men/44.jpg',
    color: '#A855F7',  // Purple
    positions: [
      { x: 25, y: 75 }, // Someone placed them bottom left
      { x: 30, y: 70 }, // Another person placed them bottom left
      { x: 20, y: 80 }  // Another person placed them bottom left
    ]
  },
  { 
    user_id: 'placeholder-3', 
    username: 'Tom', 
    avatar_url: 'https://randomuser.me/api/portraits/men/67.jpg',
    color: '#3B82F6',  // Blue
    positions: [
      { x: 50, y: 50 }, // Someone placed them center
      { x: 45, y: 55 }, // Another person placed them center
      { x: 55, y: 45 }  // Another person placed them center
    ]
  }
]

// Default users for self placed view
const DEFAULT_USERS = [
  {
    user_id: 'janina',
    username: 'Janina',
    avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    color: '#EF4444', // Red
    default_x: 20, // Top left
    default_y: 20,
  },
  {
    user_id: 'ishan',
    username: 'Ishan',
    avatar_url: 'https://randomuser.me/api/portraits/men/22.jpg',
    color: '#3B82F6', // Blue
    default_x: 80, // Top right
    default_y: 20,
  },
  {
    user_id: 'samantha',
    username: 'Samantha',
    avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg',
    color: '#F59E42', // Orange
    default_x: 20, // Bottom left
    default_y: 80,
  },
  {
    user_id: 'nils',
    username: 'Nils',
    avatar_url: 'https://randomuser.me/api/portraits/men/15.jpg',
    color: '#10B981', // Green
    default_x: 80, // Bottom right
    default_y: 80,
  },
  {
    user_id: 'melody',
    username: 'Melody',
    avatar_url: 'https://randomuser.me/api/portraits/women/12.jpg',
    color: '#A855F7', // Purple
    default_x: 50, // Center
    default_y: 50,
  },
]

// Hard-coded guessed positions for each user (in percent, some close, some further from self-placed)
const GUESSED_POSITIONS: Record<string, { x: number; y: number }> = {
  janina: { x: 35, y: 25 },    // upper center (close to self)
  ishan: { x: 75, y: 35 },     // slightly lower right (close to self)
  samantha: { x: 30, y: 65 },  // center left (moderate move)
  nils: { x: 60, y: 80 },      // bottom center (distinct)
  melody: { x: 55, y: 40 },    // slightly above center (close to self)
}

// Helper to generate a random number in a range
function randInRange(min: number, max: number) {
  return Math.random() * (max - min) + min
}

// Helper to generate a small random offset (for guessed positions)
function smallOffset() {
  return (Math.random() - 0.5) * 15; // -7.5% to +7.5%
}

export default function Results() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selfPlacements, setSelfPlacements] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [view, setView] = useState<'self' | 'guessed'>('self')

  // Memoized randomized positions for default users (per session)
  const randomizedDefaultPositions = useMemo(() => {
    // Use sessionStorage to persist positions for the session
    const key = 'defaultUserPositions'
    const stored = sessionStorage.getItem(key)
    if (stored) return JSON.parse(stored)
    // Otherwise, generate new random positions
    const positions = {
      janina: { x: randInRange(10, 35), y: randInRange(10, 35) }, // Top left
      ishan: { x: randInRange(65, 90), y: randInRange(10, 35) }, // Top right
      samantha: { x: randInRange(10, 35), y: randInRange(65, 90) }, // Bottom left
      nils: { x: randInRange(65, 90), y: randInRange(65, 90) }, // Bottom right
      melody: { x: randInRange(40, 60), y: randInRange(40, 60) }, // Center
    }
    sessionStorage.setItem(key, JSON.stringify(positions))
    return positions
  }, [])

  // Fetch data on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }
        
        // Get user ID (from session storage or auth)
        const userId = sessionStorage.getItem('currentUserId') || user.id
        setCurrentUserId(userId)
        
        // Get group ID
        const storedGroupId = sessionStorage.getItem('currentGroupId')
        
        if (!storedGroupId) {
          setError('No active group found. Please go back and select a group.')
          return
        }
        
        setGroupId(storedGroupId)
        
        // Fetch where users placed themselves
        const { data: placements, error: fetchError } = await supabase
          .from('place_yourself')
          .select('*')
          .eq('group_id', storedGroupId)
        
        if (fetchError) throw fetchError
        
        setSelfPlacements(placements || [])
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [router])

  // Helper to compute average guess for each member
  function getAveragedGuesses() {
    return PLACEHOLDER_PLACEMENTS.map(member => {
      const avg = member.positions.reduce((acc, pos) => ({
        x: acc.x + pos.x,
        y: acc.y + pos.y
      }), { x: 0, y: 0 })
      const n = member.positions.length
      return {
        ...member,
        avgX: avg.x / n,
        avgY: avg.y / n
      }
    })
  }

  // Helper to get placements for default users, and add current user if not present
  function getSelfPlacedTokens() {
    // Map placements by user_id for quick lookup
    const placementMap = Object.fromEntries(selfPlacements.map(p => [p.user_id, p]))
    // Start with default users
    let users = [...DEFAULT_USERS]
    // If current user is not in default users and has a placement, add them
    if (currentUserId && !users.some(u => u.user_id === currentUserId)) {
      const placement = placementMap[currentUserId]
      if (placement) {
        users.push({
          user_id: placement.user_id,
          username: placement.first_name || 'You',
          avatar_url: placement.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg',
          color: '#FBBF24', // Amber for extra user
          default_x: 50,
          default_y: 50,
        })
      }
    }
    // For each user, get their placement if available, else use a randomized default position
    return users.map((user, i) => {
      const placement = placementMap[user.user_id]
      let x = user.default_x, y = user.default_y
      if (randomizedDefaultPositions[user.user_id]) {
        x = randomizedDefaultPositions[user.user_id].x
        y = randomizedDefaultPositions[user.user_id].y
      }
      return {
        ...user,
        x: placement ? placement.position_x : x,
        y: placement ? placement.position_y : y,
      }
    })
  }

  // Helper to get guessed positions for each user (hard-coded)
  function getGuessedTokens() {
    // Use the same users as self placed
    const users = getSelfPlacedTokens()
    // For each user, use the hard-coded guessed position if available, else fallback to center
    return users.map(user => {
      const guessed = GUESSED_POSITIONS[user.user_id] || { x: 50, y: 50 }
      return {
        ...user,
        x: guessed.x,
        y: guessed.y,
      }
    })
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm relative">
        {/* Back Button */}
        <button
          className="absolute left-0 top-0 flex items-center p-2"
          onClick={() => router.push('/home')}
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="h-6 w-6 text-black" />
        </button>

        {/* Toggle Filter */}
        <div className="flex justify-center mb-6 mt-2">
          <div className="flex bg-gray-200 rounded-full p-1 w-fit">
            <button
              className={`px-4 py-1 rounded-full text-sm font-bold transition-all duration-150 ${view === 'self' ? 'bg-white border-2 border-black shadow' : 'text-gray-500'}`}
              onClick={() => setView('self')}
            >
              self placed
            </button>
            <button
              className={`px-4 py-1 rounded-full text-sm font-bold transition-all duration-150 ml-1 ${view === 'guessed' ? 'bg-white border-2 border-black shadow' : 'text-gray-500'}`}
              onClick={() => setView('guessed')}
            >
              guessed
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}

        {/* Axis with tokens */}
        <div className="relative">
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
            {[view === 'self' ? getSelfPlacedTokens() : getGuessedTokens()].flat().map((user) => (
              <div
                key={user.user_id}
                style={{
                  position: 'absolute',
                  left: user.x + '%',
                  top: user.y + '%',
                  transform: 'translate(-50%, -50%)',
                  transition: 'left 0.7s cubic-bezier(0.4,0,0.2,1), top 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
                  zIndex: 10,
                }}
              >
                <Token
                  id={user.user_id}
                  name={user.username}
                  x={0}
                  y={0}
                  color={user.color}
                  size={TOKEN_SIZE}
                  imageUrl={user.avatar_url}
                  showTooltip={false}
                />
              </div>
            ))}
          </Axis>
        </div>
      </div>
    </main>
  )
} 