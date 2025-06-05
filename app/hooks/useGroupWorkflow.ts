// hooks/useGroupWorkflow.ts
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'

interface Position {
  x: number
  y: number
}

interface UserToken {
  id: string
  firstName: string
  userAvatar: string
  position: Position
}

interface UserGroup {
  id: string
  name: string
  invite_code: string
  role: string
}

interface GroupMember {
  user_id: string
  username: string
  avatar_url: string
  role: string
}

interface DailyAxis {
  id: string
  group_id: string
  vertical_axis_pair_id: string
  horizontal_axis_pair_id: string
  left_label: string
  right_label: string
  top_label: string
  bottom_label: string
  date_generated: string
  is_active: boolean
  labels: {
    top: string
    bottom: string
    left: string
    right: string
    labelColors: {
      top: string
      bottom: string
      left: string
      right: string
    }
  }
}

// Colors for members (consistent assignment)
const getMemberColor = (index: number): string => {
  const colors = [
    '#EF4444', // Red
    '#10B981', // Green  
    '#A855F7', // Purple
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#F97316', // Orange
  ]
  
  return colors[index % colors.length]
}

// Calculate initial positions in a circle
const calculateInitialPositions = (memberCount: number): Position[] => {
  const positions: Position[] = []
  
  for (let i = 0; i < memberCount; i++) {
    const angle = (i * 2 * Math.PI) / memberCount
    const radius = 300 * 0.3 // 30% from center (assuming 300px grid size)
    const centerX = 150 // Half of 300
    const centerY = 150 // Half of 300
    
    const x = Math.max(18, Math.min(282, centerX + Math.cos(angle) * radius))
    const y = Math.max(18, Math.min(282, centerY + Math.sin(angle) * radius))
    
    positions.push({ x, y })
  }
  
  return positions
}

export const useGroupWorkflow = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [tokens, setTokens] = useState<UserToken[]>([])

  // REMOVED: Random group selection logic - now uses session storage from home page
  const initializeWorkflow = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error("Error fetching user:", userError)
        router.push('/login')
        return
      }
      
      setCurrentUserId(user.id)
      
      // UPDATED: Get workflow group from session storage (set by home page)
      const groupId = sessionStorage.getItem('workflowGroupId')
      const groupName = sessionStorage.getItem('workflowGroupName')
      const groupCode = sessionStorage.getItem('workflowGroupCode')
      
      if (!groupId || !groupName || !groupCode) {
        setError('No workflow group found. Please select an axis from the home page.')
        setLoading(false)
        return
      }
      
      const workflowGroup = {
        id: groupId,
        name: groupName,
        invite_code: groupCode,
        role: 'member' // We don't store role in session, but it's not critical here
      }
      
      setSelectedGroup(workflowGroup)
      console.log('📋 Retrieved workflow group from session:', workflowGroup.name, '(ID:', workflowGroup.id, ')')
      
      // Fetch members for the workflow group
      await fetchGroupMembers(groupId, user.id)
      
    } catch (err: any) {
      console.error('Error initializing workflow:', err)
      setError(err.message || 'Failed to initialize workflow')
    } finally {
      setLoading(false)
    }
  }

  // Get workflow group from session storage (for subsequent pages)
  const getWorkflowGroup = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error("Error fetching user:", userError)
        router.push('/login')
        return
      }
      
      setCurrentUserId(user.id)
      
      // Get workflow group from session storage
      const groupId = sessionStorage.getItem('workflowGroupId')
      const groupName = sessionStorage.getItem('workflowGroupName')
      const groupCode = sessionStorage.getItem('workflowGroupCode')
      
      if (!groupId || !groupName || !groupCode) {
        setError('No active workflow group. Please start from the home page.')
        return
      }
      
      const workflowGroup = {
        id: groupId,
        name: groupName,
        invite_code: groupCode,
        role: 'member' // We don't store role in session, but it's not critical here
      }
      
      setSelectedGroup(workflowGroup)
      console.log('📋 Retrieved workflow group from session:', workflowGroup.name, '(ID:', workflowGroup.id, ')')
      
      // Fetch members for the workflow group
      await fetchGroupMembers(groupId, user.id)
      
    } catch (err: any) {
      console.error('Error getting workflow group:', err)
      setError(err.message || 'Failed to get workflow group')
    } finally {
      setLoading(false)
    }
  }

  // Fetch group members for a specific group
  const fetchGroupMembers = async (groupId: string, currentUserId: string) => {
    try {
      // Fetch group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('id, role, user_id, joined_at')
        .eq('group_id', groupId)
        
      if (membersError) {
        console.error("Error fetching group members:", membersError)
        setError('Failed to load group members')
        return
      }
      
      // Get user profiles for the members
      const memberUserIds = membersData.map(member => member.user_id)
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', memberUserIds)
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
        setError('Failed to load member profiles')
        return
      }
      
      // Transform member data
      const allGroupMembers = membersData.map((member, index) => {
        const profile = profiles.find(p => p.id === member.user_id)
        return {
          user_id: member.user_id,
          username: profile?.name || `User ${index + 1}`,
          avatar_url: profile?.avatar_url || `https://i.pravatar.cc/150?img=${index + 1}`,
          role: member.role
        }
      })
      
      setGroupMembers(allGroupMembers)
      
      // Create tokens for other members (excluding current user)
      const otherMembers = allGroupMembers.filter(member => member.user_id !== currentUserId)
      const initialPositions = calculateInitialPositions(otherMembers.length)
      
      const userTokens: UserToken[] = otherMembers.map((member, index) => ({
        id: member.user_id,
        firstName: member.username,
        userAvatar: member.avatar_url,
        position: initialPositions[index]
      }))
      
      setTokens(userTokens)
      console.log(`👥 Loaded ${allGroupMembers.length} group members (${otherMembers.length} others to place)`)
      
    } catch (err: any) {
      console.error('Error fetching group members:', err)
      setError('Failed to load group members')
    }
  }

  // Handle position changes for place others
  const handlePositionChange = async (tokenId: string, position: Position) => {
    try {
      // Ensure position values are within bounds
      const boundedX = Math.max(0, Math.min(position.x, 300 - 35))
      const boundedY = Math.max(0, Math.min(position.y, 300 - 35))
      
      // Convert position from pixels to percentage
      const percentX = boundedX / (300 - 35)
      const percentY = boundedY / (300 - 35)
      
      console.log(`📍 Raw position for ${tokenId}:`, position)
      console.log(`📍 Bounded position for ${tokenId}:`, { x: boundedX, y: boundedY })
      console.log(`📍 Final percentage for ${tokenId}:`, { x: percentX, y: percentY })
      
      setTokens(prevTokens => {
        const newTokens = prevTokens.map(token => 
          token.id === tokenId 
            ? { ...token, position: { x: percentX, y: percentY } }
            : token
        )
        console.log('📍 Updated tokens:', newTokens)
        return newTokens
      })
    } catch (err: any) {
      console.error('Error updating position:', err)
      setError(err.message || 'Failed to update position')
    }
  }

  /**
   * Save self placement - UPDATED for new workflow
   * No longer needs saveAxisToDatabase function since axes are already in database
   */
  const saveSelfPlacement = async (
    position: Position, 
    userName: string, 
    firstName: string, 
    dailyAxis: DailyAxis
  ) => {
    if (!selectedGroup || !currentUserId) {
      throw new Error('Missing user or group information')
    }
    
    if (!dailyAxis) {
      throw new Error('Missing daily axis information')
    }
    
    try {
      console.log('💾 Saving self placement for user:', firstName)
      console.log('📊 Using daily axis:', dailyAxis.id, 'for group:', selectedGroup.name)

      const targetAxisId = sessionStorage.getItem('targetAxisId')
      if (targetAxisId) {
        console.log('🎯 Clearing target axis after placement')
        sessionStorage.removeItem('targetAxisId')
      }
      
      // Convert position from pixels to percent if needed
      const percentX = typeof position.x === 'number' && position.x > 100 ? (position.x / 300) * 100 : position.x
      const percentY = typeof position.y === 'number' && position.y > 100 ? (position.y / 300) * 100 : position.y
      
      // Get today's date for consistency
      const today = new Date().toISOString().split('T')[0]
      
      // Check if user already placed themselves today for this group
      const { data: existingPlacement, error: checkError } = await supabase
        .from('place_yourself')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('group_id', selectedGroup.id)
        .eq('axis_id', dailyAxis.id)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing placement:', checkError)
        // Continue anyway - we'll let the database handle duplicates
      }

      if (existingPlacement) {
        console.log('📝 User already placed themselves today, updating existing placement')
        
        // Update existing placement
        const { error: updateError } = await supabase
          .from('place_yourself')
          .update({
            position_x: percentX,
            position_y: percentY,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPlacement.id)

        if (updateError) {
          console.error('❌ Error updating self placement:', updateError)
          throw updateError
        }

        console.log('✅ Successfully updated self placement')
        return
      }

      // Insert new placement
      const { error: insertError } = await supabase
        .from('place_yourself')
        .insert({
          user_id: currentUserId,
          group_id: selectedGroup.id,
          group_code: selectedGroup.invite_code,
          username: userName,
          first_name: firstName,
          position_x: percentX,
          position_y: percentY,
          top_label: dailyAxis.labels.top,
          bottom_label: dailyAxis.labels.bottom,
          left_label: dailyAxis.labels.left,
          right_label: dailyAxis.labels.right,
          axis_id: dailyAxis.id,
          vertical_axis_pair_id: dailyAxis.vertical_axis_pair_id,
          horizontal_axis_pair_id: dailyAxis.horizontal_axis_pair_id,
          date_placed: today
        })
      
      if (insertError) {
        console.error('❌ Error inserting self placement:', insertError)
        throw insertError
      }
      
      console.log('✅ Successfully saved new self placement')
      
    } catch (err: any) {
      console.error('Error saving self placement:', err)
      throw new Error(err.message || 'Failed to save your placement')
    }
  }

  /**
   * Save others placements - UPDATED for new workflow
   */
  const saveOthersPlacement = async (dailyAxis: DailyAxis) => {
    if (!selectedGroup || !currentUserId) {
      throw new Error('Missing user or group information')
    }
    
    if (!dailyAxis) {
      throw new Error('Missing daily axis information')
    }
    
    try {
      console.log('💾 Saving others placements for', tokens.length, 'group members')
      console.log('📊 Using daily axis:', dailyAxis.id, 'for group:', selectedGroup.name)
      
      // Get today's date for consistency
      const today = new Date().toISOString().split('T')[0]
      
      // Clear existing placements by this user for this axis to avoid duplicates
      const { error: deleteError } = await supabase
        .from('place_others')
        .delete()
        .eq('placer_user_id', currentUserId)
        .eq('axis_id', dailyAxis.id)

      if (deleteError) {
        console.warn('⚠️ Could not clear existing placements (continuing anyway):', deleteError)
      }

      // Insert new placements
      const placementsToInsert = tokens.map(token => ({
        placer_user_id: currentUserId,
        placed_user_id: token.id,
        group_id: selectedGroup.id,
        group_code: selectedGroup.invite_code,
        username: token.firstName,
        first_name: token.firstName,
        position_x: token.position.x * 100, // Convert from 0-1 to 0-100
        position_y: token.position.y * 100, // Convert from 0-1 to 0-100
        top_label: dailyAxis.labels.top,
        bottom_label: dailyAxis.labels.bottom,
        left_label: dailyAxis.labels.left,
        right_label: dailyAxis.labels.right,
        axis_id: dailyAxis.id,
        vertical_axis_pair_id: dailyAxis.vertical_axis_pair_id,
        horizontal_axis_pair_id: dailyAxis.horizontal_axis_pair_id,
        date_placed: today
      }))

      if (placementsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('place_others')
          .insert(placementsToInsert)
        
        if (insertError) {
          console.error('❌ Error saving others placements:', insertError)
          throw insertError
        }
        
        console.log('✅ Successfully saved', placementsToInsert.length, 'others placements')
      } else {
        console.log('ℹ️ No other members to place')
      }
      
    } catch (err: any) {
      console.error('Error saving others placements:', err)
      throw new Error(err.message || 'Failed to save placements')
    }
  }

  return {
    loading,
    error,
    currentUserId,
    userGroups,
    selectedGroup,
    groupMembers,
    tokens,
    initializeWorkflow,
    getWorkflowGroup,
    handlePositionChange,
    saveSelfPlacement,
    saveOthersPlacement
  }
}