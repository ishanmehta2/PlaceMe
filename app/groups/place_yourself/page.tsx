'use client'

import { useRouter } from 'next/navigation'
import { DndContext } from '@dnd-kit/core'
import { supabase } from '../../../lib/auth/supabase'
import { useUserData } from '../../hooks/useUserData'
import { useDragAndDrop } from '../../hooks/useDragAndDrop'
import { DraggableToken } from '../../components/DraggableToken'
import Axis from '../../components/Axis'

// Constants for sizing
const AXIS_SIZE = 300
const TOKEN_SIZE = 35

export default function PlaceYourself() {
  const router = useRouter()
  const { userName, firstName, userAvatar, loading, error } = useUserData()
  
  // Start at center of grid, accounting for token size
  const initialPositions = { 
    'user-token': { 
      x: (AXIS_SIZE - TOKEN_SIZE) / 2, 
      y: (AXIS_SIZE - TOKEN_SIZE) / 2 
    }
  }
  
  const {
    positions,
    activeId,
    gridRef,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  } = useDragAndDrop(initialPositions)

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
        throw new Error('Missing group information. Please go back and try again.')
      }
      
      // Convert position from pixels to percent
      const userPosition = positions['user-token']
      const percentX = (userPosition.x / AXIS_SIZE) * 100
      const percentY = (userPosition.y / AXIS_SIZE) * 100
      
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
          top_label: 'Wet Sock',
          bottom_label: 'Dry Tongue',
          left_label: 'Tree Hugger',
          right_label: 'Lumberjack',
          created_at: new Date().toISOString()
        })
      
      if (saveError) throw saveError
      
      // Navigate to place_others
      router.push('/groups/place_others')
    } catch (err: any) {
      console.error('Error saving position:', err)
      throw new Error(err.message || 'Failed to save your preferences')
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
                <DraggableToken
                  id="user-token"
                  position={positions['user-token']}
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