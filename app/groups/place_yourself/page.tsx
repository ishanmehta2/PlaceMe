'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../../lib/auth/supabase'

export default function PlaceYourself() {
  const router = useRouter()
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [userName, setUserName] = useState('')
  const [firstName, setFirstName] = useState('')
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
        
        // Get current user ID from session storage if available
        const currentUserId = sessionStorage.getItem('currentUserId') || user.id
        
        // Get user profile with detailed information
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single()
        
        if (profileError) {
          console.error('Error fetching profile:', profileError)
          // If we can't get the profile, try to use what we have
          setUserName(user.email || 'User')
          setFirstName(user.email?.split('@')[0] || 'User')
        } else if (profile) {
          // Set user information from profile
          setUserName(profile.username || profile.full_name || user.email || 'User')
          
          // Extract first name from full name if available
          if (profile.full_name) {
            setFirstName(profile.full_name.split(' ')[0])
          } else if (profile.username) {
            setFirstName(profile.username)
          } else if (user.email) {
            setFirstName(user.email.split('@')[0])
          } else {
            setFirstName('User')
          }
          
          setUserAvatar(profile.avatar_url || '')
          
          // Save user info to session storage for other pages
          sessionStorage.setItem('currentUserName', profile.username || profile.full_name || user.email || 'User')
          sessionStorage.setItem('currentFirstName', firstName)
          sessionStorage.setItem('currentUserAvatar', profile.avatar_url || '')
        }
        
        // Check if we have group information in session storage
        const groupId = sessionStorage.getItem('currentGroupId')
        const groupCode = sessionStorage.getItem('currentGroupCode')
        
        if (groupId && groupCode) {
          console.log('Group found in session storage:', groupId, groupCode)
          
          // Check if user is a member of this group
          const { data: memberData, error: memberError } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', groupId)
            .eq('user_id', currentUserId)
            .single()
          
          if (memberError && memberError.code === 'PGRST116') {
            // User is not a member of this group, let's add them
            const { error: addMemberError } = await supabase
              .from('group_members')
              .insert({
                group_id: groupId,
                user_id: currentUserId,
                role: 'member',
                created_at: new Date().toISOString()
              })
            
            if (addMemberError) {
              console.error('Error adding user as member:', addMemberError)
            }
          }
        } else {
          // No group in session storage, try to find one
          
          // First, check groups the user has created
          const { data: createdGroups, error: createdGroupsError } = await supabase
            .from('groups')
            .select('*')
            .eq('created_by', currentUserId)
            .order('created_at', { ascending: false })
            .limit(1)
          
          if (!createdGroupsError && createdGroups && createdGroups.length > 0) {
            // User created a group, use that one
            const group = createdGroups[0]
            
            sessionStorage.setItem('currentGroupId', group.id)
            sessionStorage.setItem('currentGroupCode', group.invite_code)
            sessionStorage.setItem('currentGroupName', group.name)
            
            // Check if user is already a member
            const { data: memberData, error: memberError } = await supabase
              .from('group_members')
              .select('*')
              .eq('group_id', group.id)
              .eq('user_id', currentUserId)
              .single()
            
            if (memberError && memberError.code === 'PGRST116') {
              // User is not a member of this group, let's add them
              const { error: addMemberError } = await supabase
                .from('group_members')
                .insert({
                  group_id: group.id,
                  user_id: currentUserId,
                  role: 'creator',
                  created_at: new Date().toISOString()
                })
              
              if (addMemberError) {
                console.error('Error adding creator as member:', addMemberError)
              }
            }
          } else {
            // If not a creator, check for group memberships
            const { data: groupMemberships, error: membershipError } = await supabase
              .from('group_members')
              .select('group_id')
              .eq('user_id', currentUserId)
              .order('created_at', { ascending: false })
              .limit(1)
            
            if (!membershipError && groupMemberships && groupMemberships.length > 0) {
              const groupId = groupMemberships[0].group_id
              
              // Get group details
              const { data: group, error: groupDetailsError } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single()
                
              if (!groupDetailsError && group) {
                sessionStorage.setItem('currentGroupId', group.id)
                sessionStorage.setItem('currentGroupCode', group.invite_code)
                sessionStorage.setItem('currentGroupName', group.name)
              } else {
                setError('Could not retrieve group details. Please create or join a group first.')
              }
            } else {
              setError('No active group found. Please create or join a group first.')
              
              // Redirect to create group after a delay
              setTimeout(() => {
                router.push('/groups/create_group')
              }, 3000)
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err)
        setError(err.message || 'Failed to load user data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [router, firstName])
  
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
                  <div className="text-white text-2xl font-bold">{firstName.charAt(0)}</div>
                )}
              </div>
              <div className="mt-1 font-bold text-sm">
                {firstName}
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