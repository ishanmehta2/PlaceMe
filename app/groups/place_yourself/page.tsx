'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'
import { DndContext, useDraggable, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import Axis from '../../components/Axis'
import Token from '../../components/Token'

// Constants for sizing
const AXIS_SIZE = 300
const TOKEN_SIZE = 35
const DRAG_SCALE = 1.2
const DRAG_SHADOW = 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))'

interface Position {
  x: number
  y: number
}

function DraggableToken({ position, isDragging, userAvatar, firstName }: { position: Position, isDragging: boolean, userAvatar: string, firstName: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'user-token',
  })

  // Calculate position with drag offset
  let x = position.x
  let y = position.y
  if (transform) {
    x += transform.x
    y += transform.y
    // Clamp to grid bounds, accounting for token size
    x = Math.max(0, Math.min(x, AXIS_SIZE - TOKEN_SIZE))
    y = Math.max(0, Math.min(y, AXIS_SIZE - TOKEN_SIZE))
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: TOKEN_SIZE,
        height: TOKEN_SIZE,
        zIndex: isDragging ? 10 : 1,
        cursor: 'grab',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        transform: isDragging ? `scale(${DRAG_SCALE})` : 'scale(1)',
        filter: isDragging ? DRAG_SHADOW : 'none',
        touchAction: 'none', // Prevent default touch actions
        transformOrigin: 'center center', // Ensure scaling happens from center
        marginLeft: `-${TOKEN_SIZE/2}px`, // Center the token on its position
        marginTop: `-${TOKEN_SIZE/2}px`, // Center the token on its position
      }}
    >
      <Token
        id="user-token"
        name={firstName}
        x={0}
        y={0}
        color="#3B82F6"
        size={TOKEN_SIZE}
        imageUrl={userAvatar}
      />
    </div>
  )
}

export default function PlaceYourself() {
  const router = useRouter()
  const gridRef = useRef<HTMLDivElement>(null)
  
  // Start at center of grid, accounting for token size
  const [position, setPosition] = useState<Position>({ 
    x: (AXIS_SIZE - TOKEN_SIZE) / 2, 
    y: (AXIS_SIZE - TOKEN_SIZE) / 2 
  })
  const [userName, setUserName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [userAvatar, setUserAvatar] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Configure sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  )

  // Handle drag start
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { delta } = event
    if (delta && gridRef.current) {
      // Get the grid container (the white background div)
      const gridContainer = gridRef.current.querySelector('div[style*="background-color: white"]')
      if (gridContainer) {
        const gridRect = gridContainer.getBoundingClientRect()
        const containerRect = gridRef.current.getBoundingClientRect()
        
        // Calculate the offset between the container and the grid
        const offsetX = gridRect.left - containerRect.left
        const offsetY = gridRect.top - containerRect.top
        
        setPosition(prev => {
          let newX = prev.x + delta.x
          let newY = prev.y + delta.y
          
          // Clamp to grid bounds, accounting for token size and offset
          newX = Math.max(0, Math.min(newX, AXIS_SIZE - TOKEN_SIZE))
          newY = Math.max(0, Math.min(newY, AXIS_SIZE - TOKEN_SIZE))
          
          return { x: newX, y: newY }
        })
      }
    }
    setActiveId(null)
  }

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveId(null)
  }

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
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single()
        
        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setUserName(user.email || 'User')
          setFirstName(user.email?.split('@')[0] || 'User')
        } else if (profile) {
          setUserName(profile.username || profile.full_name || user.email || 'User')
          setFirstName(profile.full_name?.split(' ')[0] || profile.username || user.email?.split('@')[0] || 'User')
          setUserAvatar(profile.avatar_url || '')
          
          // Save user info to session storage
          sessionStorage.setItem('currentUserName', profile.username || profile.full_name || user.email || 'User')
          sessionStorage.setItem('currentFirstName', firstName)
          sessionStorage.setItem('currentUserAvatar', profile.avatar_url || '')
        }
        
        // Check group information
        const groupId = sessionStorage.getItem('currentGroupId')
        const groupCode = sessionStorage.getItem('currentGroupCode')
        
        if (groupId && groupCode) {
          // Check if user is a member
          const { error: memberError } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', groupId)
            .eq('user_id', currentUserId)
            .single()
          
          if (memberError?.code === 'PGRST116') {
            // Add user as member
            await supabase
              .from('group_members')
              .insert({
                group_id: groupId,
                user_id: currentUserId,
                role: 'member',
                created_at: new Date().toISOString()
              })
          }
        } else {
          // Try to find a group
          const { data: createdGroups } = await supabase
            .from('groups')
            .select('*')
            .eq('created_by', currentUserId)
            .order('created_at', { ascending: false })
            .limit(1)
          
          if (createdGroups?.length) {
            const group = createdGroups[0]
            sessionStorage.setItem('currentGroupId', group.id)
            sessionStorage.setItem('currentGroupCode', group.invite_code)
            sessionStorage.setItem('currentGroupName', group.name)
            
            // Add creator as member if needed
            const { error: memberError } = await supabase
              .from('group_members')
              .select('*')
              .eq('group_id', group.id)
              .eq('user_id', currentUserId)
              .single()
            
            if (memberError?.code === 'PGRST116') {
              await supabase
                .from('group_members')
                .insert({
                  group_id: group.id,
                  user_id: currentUserId,
                  role: 'creator',
                  created_at: new Date().toISOString()
                })
            }
          } else {
            // Check for group memberships
            const { data: groupMemberships } = await supabase
              .from('group_members')
              .select('group_id')
              .eq('user_id', currentUserId)
              .order('created_at', { ascending: false })
              .limit(1)
            
            if (groupMemberships?.length) {
              const { data: group } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupMemberships[0].group_id)
                .single()
                
              if (group) {
                sessionStorage.setItem('currentGroupId', group.id)
                sessionStorage.setItem('currentGroupCode', group.invite_code)
                sessionStorage.setItem('currentGroupName', group.name)
              } else {
                setError('Could not retrieve group details. Please create or join a group first.')
              }
            } else {
              setError('No active group found. Please create or join a group first.')
              setTimeout(() => router.push('/groups/create_group'), 3000)
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

  // Proceed to confirmation screen
  const handleNext = async () => {
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      // Get current user ID from session storage if available
      const currentUserId = sessionStorage.getItem('currentUserId') || user.id
      
      // Get group info from session storage
      const groupId = sessionStorage.getItem('currentGroupId')
      const groupCode = sessionStorage.getItem('currentGroupCode')
      
      if (!groupId || !groupCode) {
        setError('Missing group information. Please go back and try again.')
        return
      }
      
      // Convert position from pixels to percent
      const percentX = (position.x / AXIS_SIZE) * 100
      const percentY = (position.y / AXIS_SIZE) * 100
      
      // Save data to the place_yourself table
      const { error: saveError } = await supabase
        .from('place_yourself')
        .insert({
          user_id: currentUserId,
          group_id: groupId,
          group_code: groupCode,
          username: userName,
          first_name: firstName,
          position_x: percentX,
          position_y: percentY,
          top_label: 'bowling',
          bottom_label: 'movies',
          left_label: 'pizza',
          right_label: 'hot dog',
          created_at: new Date().toISOString()
        })
      
      if (saveError) throw saveError
      
      // Navigate to place_others
      router.push('/groups/place_others')
    } catch (err: any) {
      console.error('Error saving position:', err)
      setError(err.message || 'Failed to save your preferences')
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
        {/* Header */}
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
          <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div ref={gridRef} className="relative">
              <Axis
                labels={{
                  top: 'bowling',
                  bottom: 'movies',
                  left: 'pizza',
                  right: 'hot dog'
                }}
                labelColors={{
                  top: '#FECACA',
                  bottom: '#DCFCE7',
                  left: '#FEF3C7',
                  right: '#DBEAFE',
                }}
                size={AXIS_SIZE}
              >
                <DraggableToken
                  position={position}
                  isDragging={activeId === 'user-token'}
                  userAvatar={userAvatar}
                  firstName={firstName}
                />
              </Axis>
            </div>
          </DndContext>
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