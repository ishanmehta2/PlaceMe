'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'
import Axis from '../../components/Axis'
import Token from '../../components/Token'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { ChevronDownIcon } from '@heroicons/react/24/solid'

// Constants for sizing
const AXIS_SIZE = 300
const TOKEN_SIZE = 35
const GUESS_TOKEN_SIZE = 25 // Smaller size for guess tokens
const ANIMATION_DURATION = 500 // Animation duration in ms

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

// Playful, meme-style comments
interface Comment {
  author: string;
  text: string;
}
type CommentsMap = { [userId: string]: Comment[] };

const INITIAL_COMMENTS: CommentsMap = {
  'janina': [
    { author: 'Ishan', text: "bro no way you're a wet sock" },
    { author: 'Samantha', text: 'I KNEW IT 😂' },
    { author: 'Nils', text: 'classic Janina moment' }
  ],
  'ishan': [
    { author: 'Janina', text: 'bro you belong here fr' },
    { author: 'Melody', text: 'never doubted for a second' },
    { author: 'Nils', text: 'this is so you' }
  ],
  'samantha': [
    { author: 'Ishan', text: 'no way you picked that spot' },
    { author: 'Janina', text: 'I called it!!' },
    { author: 'Melody', text: 'this is your whole personality' }
  ],
  'nils': [
    { author: 'Samantha', text: 'bro you are not real for this' },
    { author: 'Ishan', text: 'I fucking knew it' },
    { author: 'Janina', text: 'never change king' }
  ],
  'melody': [
    { author: 'Nils', text: 'this is so melody coded' },
    { author: 'Samantha', text: 'I saw this coming from a mile away' },
    { author: 'Ishan', text: 'no notes, perfect placement' }
  ]
}

// Interface for individual guesses
interface IndividualGuess {
  guesser: string;
  position: { x: number; y: number };
}

// Individual guesses for each user
const INDIVIDUAL_GUESSES: Record<string, IndividualGuess[]> = {
  janina: [
    { guesser: 'Ishan', position: { x: 15, y: 10 } },    // Far top left
    { guesser: 'Samantha', position: { x: 45, y: 35 } }, // Center
    { guesser: 'Nils', position: { x: 75, y: 20 } }      // Far top right
  ],
  ishan: [
    { guesser: 'Janina', position: { x: 85, y: 15 } },   // Far top right
    { guesser: 'Melody', position: { x: 65, y: 45 } },   // Center right
    { guesser: 'Nils', position: { x: 90, y: 75 } }      // Far bottom right
  ],
  samantha: [
    { guesser: 'Ishan', position: { x: 10, y: 70 } },    // Far bottom left
    { guesser: 'Janina', position: { x: 35, y: 55 } },   // Center left
    { guesser: 'Melody', position: { x: 60, y: 80 } }    // Bottom center
  ],
  nils: [
    { guesser: 'Samantha', position: { x: 70, y: 85 } }, // Far bottom right
    { guesser: 'Ishan', position: { x: 45, y: 65 } },    // Center bottom
    { guesser: 'Janina', position: { x: 20, y: 90 } }    // Far bottom left
  ],
  melody: [
    { guesser: 'Nils', position: { x: 40, y: 25 } },     // Upper center
    { guesser: 'Samantha', position: { x: 65, y: 35 } }, // Upper right
    { guesser: 'Ishan', position: { x: 25, y: 45 } }     // Center left
  ]
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
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentsMap>(INITIAL_COMMENTS)
  const [newComment, setNewComment] = useState('')
  const commentsEndRef = useRef<HTMLDivElement | null>(null)
  const [showIndividualGuesses, setShowIndividualGuesses] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Auto-scroll to bottom when comments or selectedToken change
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments, selectedToken])

  // Reset animation when token selection changes
  useEffect(() => {
    if (selectedToken && view === 'guessed') {
      setIsAnimating(true)
      setAnimationProgress(0)
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
        setAnimationProgress(progress)
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [selectedToken, view])

  // Handle deselection animation
  useEffect(() => {
    if (!selectedToken && view === 'guessed' && showIndividualGuesses) {
      setIsAnimating(true)
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.max(1 - (elapsed / ANIMATION_DURATION), 0)
        setAnimationProgress(progress)
        if (progress > 0) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
          setShowIndividualGuesses(false)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [selectedToken, view, showIndividualGuesses])

  // Helper to interpolate position based on animation progress
  function interpolatePosition(start: number, end: number, progress: number) {
    return start + (end - start) * progress
  }

  // Memoized randomized positions for default users (per session)
  const randomizedDefaultPositions = useMemo(() => {
    // Use sessionStorage to persist positions for the session
    const key = 'defaultUserPositions'
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(key)
      if (stored) return JSON.parse(stored)
    }
    // Otherwise, generate new random positions
    const positions = {
      janina: { x: randInRange(10, 35), y: randInRange(10, 35) }, // Top left
      ishan: { x: randInRange(65, 90), y: randInRange(10, 35) }, // Top right
      samantha: { x: randInRange(10, 35), y: randInRange(65, 90) }, // Bottom left
      nils: { x: randInRange(65, 90), y: randInRange(65, 90) }, // Bottom right
      melody: { x: randInRange(40, 60), y: randInRange(40, 60) }, // Center
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(positions))
    }
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
    return Object.entries(INDIVIDUAL_GUESSES).map(([userId, guesses]) => {
      const avg = guesses.reduce((acc, guess) => ({
        x: acc.x + guess.position.x,
        y: acc.y + guess.position.y
      }), { x: 0, y: 0 })
      const n = guesses.length
      return {
        user_id: userId,
        x: avg.x / n,
        y: avg.y / n
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

  // Helper to get guessed positions for each user (calculated from individual guesses)
  function getGuessedTokens() {
    // Use the same users as self placed
    const users = getSelfPlacedTokens()
    // Calculate average positions from individual guesses
    const averagePositions = getAveragedGuesses()
    // Map users to their average guessed positions
    return users.map(user => {
      const avgPos = averagePositions.find(pos => pos.user_id === user.user_id)
      return {
        ...user,
        x: avgPos ? avgPos.x : 50, // Fallback to center if no guesses
        y: avgPos ? avgPos.y : 50,
      }
    })
  }

  // Helper to get individual guesses for a user
  function getIndividualGuesses(userId: string) {
    return INDIVIDUAL_GUESSES[userId] || []
  }

  function handleAddComment() {
    if (!selectedToken || !newComment.trim()) return
    // For demo, author is always 'You'
    setComments(prev => ({
      ...prev,
      [selectedToken]: [
        ...(prev[selectedToken] || []),
        { author: 'You', text: newComment.trim() }
      ]
    }))
    setNewComment('')
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAddComment()
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
            {/* Click handler for the entire axis */}
            <div 
              className="absolute inset-0 z-10"
              onClick={() => {
                if (selectedToken) {
                  setSelectedToken(null)
                }
              }}
            />

            {/* Main tokens - fade out when showing individual guesses */}
            {[view === 'self' ? getSelfPlacedTokens() : getGuessedTokens()].flat().map((user) => (
              <div
                key={user.user_id}
                style={{
                  position: 'absolute',
                  left: user.x + '%',
                  top: user.y + '%',
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.3s ease-in-out',
                  zIndex: selectedToken === user.user_id ? 15 : 10,
                  opacity: view === 'guessed' && selectedToken && selectedToken !== user.user_id ? 0 : 
                          (selectedToken && selectedToken !== user.user_id ? 0.6 : 
                          (selectedToken === user.user_id && view === 'guessed' ? 0.4 : 1)),
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation() // Prevent axis click handler from firing
                  if (view === 'guessed') {
                    setShowIndividualGuesses(true)
                  }
                  setSelectedToken(selectedToken === user.user_id ? null : user.user_id)
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
                  isSelected={selectedToken === user.user_id}
                />
              </div>
            ))}

            {/* Individual guess tokens (only shown when a token is selected in guessed view) */}
            {view === 'guessed' && selectedToken && (showIndividualGuesses || isAnimating) && 
              getIndividualGuesses(selectedToken).map((guess, index) => {
                // Get the average position for the selected token from the calculated averages
                const avgPos = getAveragedGuesses().find(pos => pos.user_id === selectedToken) || { x: 50, y: 50 }
                // Calculate the final position
                const finalX = guess.position.x
                const finalY = guess.position.y
                // Interpolate position based on animation progress
                const currentX = interpolatePosition(avgPos.x, finalX, animationProgress)
                const currentY = interpolatePosition(avgPos.y, finalY, animationProgress)

                return (
                  <div
                    key={`guess-${index}`}
                    style={{
                      position: 'absolute',
                      left: currentX + '%',
                      top: currentY + '%',
                      transform: 'translate(-50%, -50%)',
                      transition: 'all 0.3s ease-in-out',
                      zIndex: 20,
                      opacity: animationProgress,
                      pointerEvents: 'none',
                    }}
                  >
                    <Token
                      id={`guess-${index}`}
                      name={guess.guesser}
                      x={0}
                      y={0}
                      color={DEFAULT_USERS.find(u => u.username === guess.guesser)?.color || '#A855F7'}
                      size={GUESS_TOKEN_SIZE}
                      imageUrl={DEFAULT_USERS.find(u => u.username === guess.guesser)?.avatar_url}
                      showTooltip={true}
                    />
                  </div>
                )
              })
            }
          </Axis>
        </div>

        {/* Comments Panel */}
        <div 
          className={`fixed bottom-0 left-0 right-0 z-50 bg-[#FFF5D6] rounded-t-[36px] shadow-2xl transition-transform duration-300 ease-in-out transform ${
            selectedToken ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ maxHeight: '80vh', minHeight: '320px', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
        >
          {selectedToken && (
            <>
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                {/* Chevron down to close */}
                <button onClick={() => {
                  setSelectedToken(null)
                  setShowIndividualGuesses(false)
                }} aria-label="Close comments" className="p-1 mr-1">
                  <ChevronDownIcon className="h-7 w-7 text-black" />
                </button>
                {/* Outlined playful header */}
                <div className="flex-1 flex justify-center items-center">
                  <span
                    className="text-3xl font-black"
                    style={{
                      fontFamily: 'Arial Black, Arial, sans-serif',
                      color: '#111',
                      letterSpacing: '-1px',
                    }}
                  >
                    {DEFAULT_USERS.find(u => u.user_id === selectedToken)?.username}
                  </span>
                </div>
                {/* Avatar */}
                <div className="ml-2 flex items-center justify-center">
                  <img
                    src={DEFAULT_USERS.find(u => u.user_id === selectedToken)?.avatar_url}
                    alt="avatar"
                    className="w-12 h-12 rounded-full border-4"
                    style={{ borderColor: DEFAULT_USERS.find(u => u.user_id === selectedToken)?.color || '#A855F7' }}
                  />
                </div>
              </div>

              {/* Comments list */}
              <div className="px-6 pb-4 pt-2">
                <div className="rounded-3xl bg-[#FFFAED] p-4 min-h-[120px] max-h-[220px] overflow-y-auto text-lg font-semibold" style={{ fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif' }}>
                  {comments[selectedToken as keyof typeof comments]?.map((comment, index) => (
                    <div key={index} className="mb-2">
                      <span className="font-bold">{comment.author}:</span> {comment.text}
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="px-6 pb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment…."
                  className="w-full rounded-full bg-[#F3F1E6] border-none px-5 py-3 text-lg placeholder:text-[#C2B68A] focus:outline-none focus:ring-2 focus:ring-[#EADFA7]"
                  style={{ fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif' }}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  disabled={!selectedToken}
                />
                <button
                  onClick={handleAddComment}
                  className="bg-[#FFE9A7] rounded-full px-4 py-2 font-bold text-[#B89B2B] border-2 border-[#EADFA7] hover:bg-[#FFF5D6] transition"
                  style={{ fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif' }}
                  disabled={!newComment.trim()}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
} 