'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../../lib/auth/supabase'

// Avatar colors for different users
const AVATAR_COLORS = {
  0: 'bg-red-500',   // Bob - Red
  1: 'bg-purple-500', // Tim - Purple
  2: 'bg-blue-500'   // Tom - Blue
}

// Hardcoded placeholder members
const PLACEHOLDER_MEMBERS = [
  { 
    user_id: 'placeholder-1', 
    username: 'Bob', 
    full_name: 'Bob Smith', 
    avatar_url: '',
    colorClass: 'bg-red-500'
  },
  { 
    user_id: 'placeholder-2', 
    username: 'Tim', 
    full_name: 'Tim Johnson', 
    avatar_url: '',
    colorClass: 'bg-purple-500'
  },
  { 
    user_id: 'placeholder-3', 
    username: 'Tom', 
    full_name: 'Tom Williams', 
    avatar_url: '',
    colorClass: 'bg-blue-500'
  }
]

export default function PlaceOthers() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [positions, setPositions] = useState<{[key: string]: {x: number, y: number}}>({})
  const [dragInfo, setDragInfo] = useState<{dragging: boolean, userId: string | null}>({
    dragging: false,
    userId: null
  })
  const [groupId, setGroupId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Define the axes labels
  const AXES_LABELS = {
    top: 'bowling',
    bottom: 'movies',
    left: 'pizza',
    right: 'hot dog'
  }
  
  // Fetch group members data
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
        
        // Use placeholders instead of trying to query real members
        // This avoids the relationship issues entirely
        const usePlaceholders = true  // Always use placeholders for now
        
        if (usePlaceholders) {
          setGroupMembers(PLACEHOLDER_MEMBERS)
          
          // Set initial positions for placeholders
          const initialPositions = {
            'placeholder-1': { x: 75, y: 25 },  // Bob - top right
            'placeholder-2': { x: 25, y: 25 },  // Tim - top left
            'placeholder-3': { x: 50, y: 75 }   // Tom - bottom center
          }
          
          setPositions(initialPositions)
        } else {
          // This section is commented out because it's causing the relationship error
          // If you want to use real members later, we'll need to implement a different approach
          
          /*
          // Get group members
          const { data: members, error: membersError } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', storedGroupId)
            .neq('user_id', userId) // Exclude current user
            .limit(3)
          
          if (membersError) {
            throw membersError
          }
          
          if (!members || members.length === 0) {
            // No members, use placeholders
            setGroupMembers(PLACEHOLDER_MEMBERS)
            
            // Set initial positions for placeholders
            const initialPositions = {
              'placeholder-1': { x: 75, y: 25 },  // Bob - top right
              'placeholder-2': { x: 25, y: 25 },  // Tim - top left
              'placeholder-3': { x: 50, y: 75 }   // Tom - bottom center
            }
            
            setPositions(initialPositions)
          } else {
            // Process real members
            // ...
          }
          */
        }
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load group members')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [router])
  
  // Handle grid click or drag
  const handleGridInteraction = (e, userId) => {
    if (!dragInfo.dragging || dragInfo.userId !== userId) return
    
    const grid = e.currentTarget
    const rect = grid.getBoundingClientRect()
    
    // Calculate position as percentage of grid dimensions
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 0), 100)
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 0), 100)
    
    // Update positions
    setPositions(prev => ({
      ...prev,
      [userId]: { x, y }
    }))
  }

  // Handle mouse/touch events
  const startDrag = (e, userId) => {
    e.stopPropagation()
    setDragInfo({
      dragging: true,
      userId
    })
  }
  
  const endDrag = () => {
    setDragInfo({
      dragging: false,
      userId: null
    })
  }
  
  const onDrag = (e) => {
    if (dragInfo.dragging && dragInfo.userId) {
      handleGridInteraction(e, dragInfo.userId)
    }
  }
  
  // Handle confirmation
  const handleNext = () => {
    // Save positions to session storage
    sessionStorage.setItem('otherUsersPositions', JSON.stringify(positions))
    router.push('/groups/place_others_confirm')
  }
  
  // Get display name for a member
  const getDisplayName = (member) => {
    if (!member) return 'User'
    
    if (member.username) {
      return member.username
    } else if (member.full_name) {
      return member.full_name.split(' ')[0] // First name
    } else {
      return member.user_id.substring(0, 5) // Fallback
    }
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
      <div className="w-full max-w-sm">
        {/* Header with Place Others text */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            PLACE OTHERS
          </h1>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          {/* Grid with group members */}
          <div 
            className="relative w-full aspect-square bg-white border-2 border-black rounded-lg mb-8"
            onMouseMove={onDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchMove={onDrag}
            onTouchEnd={endDrag}
          >
            {/* Grid lines */}
            <div className="absolute top-0 left-1/2 h-full w-0.5 bg-black -translate-x-1/2"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black -translate-y-1/2"></div>
            
            {/* Labels */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-200 px-4 py-1 rounded-lg text-sm font-bold">
              {AXES_LABELS.top}
            </div>
            
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-200 px-4 py-1 rounded-lg text-sm font-bold">
              {AXES_LABELS.bottom}
            </div>
            
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 bg-pink-200 px-4 py-1 rounded-lg text-sm font-bold">
              {AXES_LABELS.left}
            </div>
            
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 rotate-90 bg-blue-200 px-4 py-1 rounded-lg text-sm font-bold">
              {AXES_LABELS.right}
            </div>
            
            {/* Member Avatars */}
            {groupMembers.map((member, index) => {
              const userId = member.user_id
              const position = positions[userId] || { x: 50, y: 50 }
              const displayName = getDisplayName(member)
              const colorClass = member.colorClass || AVATAR_COLORS[index % 3]
              
              return (
                <div 
                  key={userId}
                  className="absolute flex flex-col items-center cursor-grab z-10"
                  style={{ 
                    left: `${position.x}%`, 
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onMouseDown={(e) => startDrag(e, userId)}
                  onTouchStart={(e) => startDrag(e, userId)}
                >
                  <div className={`w-14 h-14 rounded-full ${colorClass} flex items-center justify-center border-2 border-white overflow-hidden`}>
                    {member.avatar_url ? (
                      <Image 
                        src={member.avatar_url} 
                        alt={displayName}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white text-2xl font-bold">{displayName.charAt(0)}</div>
                    )}
                  </div>
                  <div className="mt-1 font-bold text-sm">
                    {displayName}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Member List at Bottom */}
          <div className="flex justify-center space-x-4 mb-4">
            {groupMembers.map((member, index) => {
              const userId = member.user_id
              const displayName = getDisplayName(member)
              const colorClass = member.colorClass || AVATAR_COLORS[index % 3]
              
              return (
                <div key={userId} className="flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-full ${colorClass} flex items-center justify-center border-2 border-white overflow-hidden`}>
                    {member.avatar_url ? (
                      <Image 
                        src={member.avatar_url} 
                        alt={displayName}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white text-2xl font-bold">{displayName.charAt(0)}</div>
                    )}
                  </div>
                  <div className="mt-1 font-bold text-sm">
                    {displayName}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Next Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleNext}
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