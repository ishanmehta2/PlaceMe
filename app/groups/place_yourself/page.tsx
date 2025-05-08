'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../../lib/auth/supabase'

export default function PlaceYourself() {
  const router = useRouter()
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [userName, setUserName] = useState('Michael')
  const [userAvatar, setUserAvatar] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) throw profileError
        
        if (profile) {
          setUserName(profile.username || profile.full_name || 'User')
          setUserAvatar(profile.avatar_url || '')
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err)
        setError(err.message || 'Failed to load user data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [router])
  
  // Handle grid click or drag
  const handleGridInteraction = (e) => {
    const grid = e.currentTarget
    const rect = grid.getBoundingClientRect()
    
    // Calculate position as percentage of grid dimensions
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 0), 100)
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 0), 100)
    
    setPosition({ x, y })
  }

  // Handle mouse/touch events
  const startDrag = (e) => {
    e.stopPropagation()
    setIsDragging(true)
  }
  
  const endDrag = () => {
    setIsDragging(false)
  }
  
  const onDrag = (e) => {
    if (isDragging) {
      handleGridInteraction(e)
    }
  }

  // Proceed to confirmation screen
  const handleNext = () => {
    // Store position in sessionStorage to pass to next screen
    sessionStorage.setItem('userPosition', JSON.stringify(position))
    router.push('/groups/place_yourself_confirm')
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
          {/* Grid for placing user */}
          <div 
            className="relative w-full aspect-square bg-white border-2 border-black rounded-lg mb-8"
            onClick={handleGridInteraction}
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
              bowling
            </div>
            
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-200 px-4 py-1 rounded-lg text-sm font-bold">
              movies
            </div>
            
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 bg-pink-200 px-4 py-1 rounded-lg text-sm font-bold">
              pizza
            </div>
            
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 rotate-90 bg-blue-200 px-4 py-1 rounded-lg text-sm font-bold">
              hot dog
            </div>
            
            {/* User Avatar */}
            <div 
              className="absolute flex flex-col items-center cursor-grab z-10"
              style={{ 
                left: `${position.x}%`, 
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onMouseDown={startDrag}
              onTouchStart={startDrag}
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
                  <div className="text-white text-2xl font-bold">{userName.charAt(0)}</div>
                )}
              </div>
              <div className="mt-1 font-bold text-sm">
                {userName}
              </div>
            </div>
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