'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../../lib/auth/supabase'

// Define the axes labels
const AXES_LABELS = {
  top: 'bowling',
  bottom: 'movies',
  left: 'pizza',
  right: 'hot dog'
}

export default function PlaceYourselfConfirm() {
  const router = useRouter()
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [userName, setUserName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [userAvatar, setUserAvatar] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [groupCode, setGroupCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
        
        setUserId(user.id)
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) throw profileError
        
        if (profile) {
          setUserName(profile.username || profile.full_name || 'User')
          // Extract first name from full name if available
          const fullName = profile.full_name || profile.username || 'User'
          setFirstName(fullName.split(' ')[0])
          setUserAvatar(profile.avatar_url || '')
        }
        
        // Get position from session storage
        const savedPosition = sessionStorage.getItem('userPosition')
        if (savedPosition) {
          setPosition(JSON.parse(savedPosition))
        }
        
        // Get group info from session storage
        const savedGroupId = sessionStorage.getItem('currentGroupId')
        const savedGroupCode = sessionStorage.getItem('currentGroupCode')
        
        setGroupId(savedGroupId)
        setGroupCode(savedGroupCode)
        
        if (!savedGroupId) {
          setError('No group information found. Please go back to the group creation.')
        }
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [router])

  // Handle confirmation
  const handleConfirm = async () => {
    if (!groupId || !userId) {
      setError('Missing user or group information. Please go back and try again.')
      return
    }
    
    try {
      setSaving(true)
      
      // Save data to the place_yourself table
      const { error: saveError } = await supabase
        .from('place_yourself')
        .insert({
          user_id: userId,
          group_id: groupId,
          group_code: groupCode,
          username: userName,
          first_name: firstName,
          position_x: position.x,
          position_y: position.y,
          top_label: AXES_LABELS.top,
          bottom_label: AXES_LABELS.bottom,
          left_label: AXES_LABELS.left,
          right_label: AXES_LABELS.right,
          created_at: new Date().toISOString()
        })
      
      if (saveError) throw saveError
      
      // Navigate to home
      router.push('/home')
    } catch (err: any) {
      console.error('Error saving position:', err)
      setError(err.message || 'Failed to save your preferences')
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
        {/* Header with Place Yourself text */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            PLACE YOURSELF
          </h1>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          {/* Grid with user's position */}
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
            
            {/* User Avatar - Fixed position based on selection */}
            <div 
              className="absolute flex flex-col items-center z-10"
              style={{ 
                left: `${position.x}%`, 
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white overflow-hidden">
                {userAvatar ? (
                  <Image 
                    src={userAvatar} 
                    alt={userName}
                    width={60}
                    height={60}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-2xl font-bold">{firstName.charAt(0)}</div>
                )}
              </div>
              <div className="mt-1 font-bold text-sm">
                {firstName}
              </div>
            </div>
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