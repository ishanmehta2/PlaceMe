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

export default function PlaceOthersConfirm() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [positions, setPositions] = useState<{[key: string]: {x: number, y: number}}>({})
  const [groupId, setGroupId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Define the axes labels
  const AXES_LABELS = {
    top: 'bowling',
    bottom: 'movies',
    left: 'pizza',
    right: 'hot dog'
  }
  
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
        
        // Get stored positions from previous screen
        const storedPositions = sessionStorage.getItem('otherUsersPositions')
        
        if (!storedPositions) {
          setError('No position data found. Please go back to the previous screen.')
          return
        }
        
        setPositions(JSON.parse(storedPositions))
        
        // Use placeholder members
        setGroupMembers(PLACEHOLDER_MEMBERS)
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load group members')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [router])
  
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
  
  // Handle confirmation
  const handleConfirm = async () => {
    if (!groupId || !currentUserId) {
      setError('Missing user or group information. Please go back and try again.')
      return
    }
    
    try {
      setSaving(true)
      
      // For now, we'll just save the position data to session storage
      // and skip the database insert since we're using placeholder users
      
      // If you want to store real member positions later:
      /*
      // Get the group code
      const groupCode = sessionStorage.getItem('currentGroupCode') || ''
      
      // Save position data for each member to the place_others table
      for (const member of groupMembers) {
        const userId = member.user_id
        
        // Skip if no position data
        if (!positions[userId]) continue
        
        // Skip placeholder users for database storage
        if (userId.startsWith('placeholder-')) continue
        
        const displayName = getDisplayName(member)
        
        // Save to the place_others table
        const { error: saveError } = await supabase
          .from('place_others')
          .insert({
            placer_user_id: currentUserId, // Current user is placing others
            placed_user_id: userId, // User being placed
            group_id: groupId,
            group_code: groupCode,
            username: member.username || '',
            first_name: displayName,
            position_x: positions[userId].x,
            position_y: positions[userId].y,
            top_label: AXES_LABELS.top,
            bottom_label: AXES_LABELS.bottom,
            left_label: AXES_LABELS.left,
            right_label: AXES_LABELS.right,
            created_at: new Date().toISOString()
          })
        
        if (saveError) {
          console.error(`Error saving position for ${displayName}:`, saveError)
        }
      }
      */
      
      // Navigate to home after a brief delay to simulate saving
      setTimeout(() => {
        router.push('/home')
      }, 500)
    } catch (err: any) {
      console.error('Error saving positions:', err)
      setError(err.message || 'Failed to save user positions')
    } finally {
      setSaving(false)
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
          {/* Grid with positioned members */}
          <div className="relative w-full aspect-square bg-white border-2 border-black rounded-lg mb-8">
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
            
            {/* Member Avatars - Fixed positions based on previous page */}
            {groupMembers.map((member, index) => {
              const userId = member.user_id
              const position = positions[userId] || { x: 50, y: 50 }
              const displayName = getDisplayName(member)
              const colorClass = member.colorClass || AVATAR_COLORS[index % 3]
              
              return (
                <div 
                  key={userId}
                  className="absolute flex flex-col items-center z-10"
                  style={{ 
                    left: `${position.x}%`, 
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
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
        </div>
        
        {/* Confirm Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="bg-[#60A5FA] py-3 px-12 rounded-full"
          >
            <span className="text-xl font-black" style={{ 
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              color: 'white',
              fontFamily: 'Arial, sans-serif'
            }}>
              {saving ? 'Saving...' : 'confirm'}
            </span>
          </button>
        </div>
      </div>
    </main>
  )
}