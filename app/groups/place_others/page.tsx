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

// Avatar colors for different users
const AVATAR_COLORS = {
  0: 'bg-red-500',   // Bob - Red
  1: 'bg-purple-500', // Tim - Purple
  2: 'bg-blue-500'   // Tom - Blue
}

// Hardcoded placeholder members
const PLACEHOLDER_MEMBERS = [
  { 
    user_id: 'janina', 
    username: 'Janina', 
    full_name: 'Janina Schmidt', 
    avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    color: '#EF4444'  // Red
  },
  { 
    user_id: 'nils', 
    username: 'Nils', 
    full_name: 'Nils Forstall', 
    avatar_url: 'https://randomuser.me/api/portraits/men/15.jpg',
    color: '#10B981'  // Green
  },
  { 
    user_id: 'melody', 
    username: 'Melody', 
    full_name: 'Melody Chen', 
    avatar_url: 'https://randomuser.me/api/portraits/women/12.jpg',
    color: '#A855F7'  // Purple
  }
]

interface Position {
  x: number
  y: number
}

function DraggableToken({ id, position, isDragging, member }: { id: string, position: Position, isDragging: boolean, member: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
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
        id={id}
        name={member.username}
        x={0}
        y={0}
        color={member.color}
        size={TOKEN_SIZE}
        imageUrl={member.avatar_url}
        showTooltip={false}
      />
    </div>
  )
}

export default function PlaceOthers() {
  const router = useRouter()
  const gridRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [positions, setPositions] = useState<{[key: string]: Position}>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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
    const { active, delta } = event
    if (delta && gridRef.current) {
      // Get the grid container (the white background div)
      const gridContainer = gridRef.current.querySelector('div[style*="background-color: white"]')
      if (gridContainer) {
        const gridRect = gridContainer.getBoundingClientRect()
        const containerRect = gridRef.current.getBoundingClientRect()
        
        // Calculate the offset between the container and the grid
        const offsetX = gridRect.left - containerRect.left
        const offsetY = gridRect.top - containerRect.top
        
        setPositions(prev => {
          const userId = active.id
          const currentPos = prev[userId] || { x: AXIS_SIZE/2, y: AXIS_SIZE/2 }
          
          let newX = currentPos.x + delta.x
          let newY = currentPos.y + delta.y
          
          // Clamp to grid bounds, accounting for token size and offset
          newX = Math.max(0, Math.min(newX, AXIS_SIZE - TOKEN_SIZE))
          newY = Math.max(0, Math.min(newY, AXIS_SIZE - TOKEN_SIZE))
          
          return {
            ...prev,
            [userId]: { x: newX, y: newY }
          }
        })
      }
    }
    setActiveId(null)
  }

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveId(null)
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
        
        // Use placeholders for now
        setGroupMembers(PLACEHOLDER_MEMBERS)
        
        // Set initial positions for placeholders
        const initialPositions = {
          'janina': { x: AXIS_SIZE * 0.25, y: AXIS_SIZE * 0.25 },  // Janina - top left
          'nils': { x: AXIS_SIZE * 0.75, y: AXIS_SIZE * 0.25 },    // Nils - top right
          'melody': { x: AXIS_SIZE * 0.5, y: AXIS_SIZE * 0.75 }    // Melody - bottom center
        }
        
        setPositions(initialPositions)
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load group members')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [router])

  // Handle confirmation
  const handleNext = async () => {
    if (!groupId || !currentUserId) {
      setError('Missing user or group information. Please go back and try again.')
      return
    }
    
    try {
      // Get the group code
      const groupCode = sessionStorage.getItem('currentGroupCode') || ''
      
      // Save position data for each member to the place_others table
      for (const member of groupMembers) {
        const userId = member.user_id
        
        // Skip if no position data
        if (!positions[userId]) continue
        
        // Skip placeholder users for database storage
        if (userId.startsWith('placeholder-')) continue
        
        // Save to the place_others table
        const { error: saveError } = await supabase
          .from('place_others')
          .insert({
            placer_user_id: currentUserId, // Current user is placing others
            placed_user_id: userId, // User being placed
            group_id: groupId,
            group_code: groupCode,
            username: member.username || '',
            first_name: member.username, // Using username as first name for now
            position_x: positions[userId].x,
            position_y: positions[userId].y,
            top_label: 'Wet Sock',
            bottom_label: 'Dry Tongue',
            left_label: 'Tree Hugger',
            right_label: 'Lumberjack',
            created_at: new Date().toISOString()
          })
        
        if (saveError) {
          console.error(`Error saving position for ${member.username}:`, saveError)
        }
      }
      
      // Navigate to results page
      router.push('/groups/results')
    } catch (err: any) {
      console.error('Error saving positions:', err)
      setError(err.message || 'Failed to save user positions')
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
          <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div ref={gridRef} className="relative">
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
                {groupMembers.map((member) => (
                  <DraggableToken
                    key={member.user_id}
                    id={member.user_id}
                    position={positions[member.user_id] || { x: AXIS_SIZE/2, y: AXIS_SIZE/2 }}
                    isDragging={activeId === member.user_id}
                    member={member}
                  />
                ))}
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