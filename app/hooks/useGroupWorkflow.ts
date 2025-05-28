// hooks/useGroupWorkflow.js
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

// Calculate initial positions in the neutral zone
const calculateInitialPositions = (memberCount: number, gridWidth: number = 300, gridHeight: number = 300, neutralZoneHeight: number = 100): Position[] => {
  const positions: Position[] = []
  const tokenSize = 35 // Size of each token
  
  // Calculate padding to evenly space tokens
  // We want (n-1) gaps between tokens and 2 gaps at the edges
  // Total available space = gridWidth - (n * tokenSize)
  // Number of gaps = n + 1
  const totalGaps = memberCount + 1
  const totalTokenWidth = memberCount * tokenSize
  const padding = (gridWidth - totalTokenWidth) / totalGaps
  
  // Position in the middle of the neutral zone
  const neutralZoneY = gridHeight + (neutralZoneHeight / 2) // Center token vertically
  
  for (let i = 0; i < memberCount; i++) {
    // Calculate x position accounting for token size
    // Each position is: padding + (i * (tokenSize + padding)) + (tokenSize / 2)
    // This centers the token in its allocated space
    const x = padding + (i * (tokenSize + padding)) + (tokenSize / 2)
    const y = neutralZoneY
    
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

  // Initialize the workflow - fetch user groups and randomly select one
  const initializeWorkflow = async () => {
    try {
      setLoading(true)
      
      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error("Error fetching user:", userError)
        router.push('/login')
        return
      }
      
      setCurrentUserId(user.id)
      
      // Fetch groups the user is a member of
      const { data: groupMemberships, error: groupsError } = await supabase
        .from('group_members')
        .select(`
          id,
          role,
          joined_at,
          group_id
        `)
        .eq('user_id', user.id)
        
      if (groupsError) {
        console.error("Error fetching group memberships:", groupsError)
        setError('Failed to fetch your groups')
        return
      }
      
      // Get the groups details
      const groupIds = groupMemberships.map(membership => membership.group_id)
      
      if (groupIds.length === 0) {
        setUserGroups([])
        setError('You are not part of any groups yet.')
        setLoading(false)
        return
      }
      
      const { data: groupsData, error: groupDetailsError } = await supabase
        .from('groups')
        .select('id, name, invite_code, settings, created_at')
        .in('id', groupIds)
      
      if (groupDetailsError) {
        console.error("Error fetching group details:", groupDetailsError)
        setError('Failed to fetch group details')
        return
      }
      
      // Combine the group details with membership info
      const formattedGroups = groupsData.map(group => {
        const membership = groupMemberships.find(m => m.group_id === group.id)
        return {
          id: group.id,
          name: group.name,
          invite_code: group.invite_code,
          role: membership?.role || 'member'
        }
      })
      
      setUserGroups(formattedGroups)
      
      // Randomly select one group for the workflow
      const randomIndex = Math.floor(Math.random() * formattedGroups.length)
      const randomGroup = formattedGroups[randomIndex]
      setSelectedGroup(randomGroup)
      
      // Store in session storage for persistence across pages
      sessionStorage.setItem('workflowGroupId', randomGroup.id)
      sessionStorage.setItem('workflowGroupName', randomGroup.name)
      sessionStorage.setItem('workflowGroupCode', randomGroup.invite_code)
      
      // Fetch members for the selected group
      await fetchGroupMembers(randomGroup.id, user.id)
      
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
        setError('No active workflow group. Please start from place yourself.')
        return
      }
      
      const workflowGroup = {
        id: groupId,
        name: groupName,
        invite_code: groupCode,
        role: 'member' // We don't store role in session, but it's not critical here
      }
      
      setSelectedGroup(workflowGroup)
      
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
      const initialPositions = calculateInitialPositions(
        otherMembers.length,
        300, // gridWidth
        300, // gridHeight
        100  // neutralZoneHeight
      )
      
      const userTokens: UserToken[] = otherMembers.map((member, index) => ({
        id: member.user_id,
        firstName: member.username,
        userAvatar: member.avatar_url,
        position: initialPositions[index]
      }))
      
      setTokens(userTokens)
      
    } catch (err: any) {
      console.error('Error fetching group members:', err)
      setError('Failed to load group members')
    }
  }

  // Handle position changes for place others
  const handlePositionChange = async (tokenId: string, position: Position) => {
    try {
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.id === tokenId 
            ? { ...token, position }
            : token
        )
      )
      
      console.log(`Updated position for ${tokenId}:`, position)
    } catch (err: any) {
      console.error('Error updating position:', err)
      setError(err.message || 'Failed to update position')
    }
  }

  // Save self placement
  const saveSelfPlacement = async (position: Position, userName: string, firstName: string) => {
    if (!selectedGroup || !currentUserId) {
      throw new Error('Missing user or group information')
    }
    
    try {
      // Convert position from pixels to percent if needed
      const percentX = typeof position.x === 'number' && position.x > 100 ? (position.x / 300) * 100 : position.x
      const percentY = typeof position.y === 'number' && position.y > 100 ? (position.y / 300) * 100 : position.y
      
      const { error: saveError } = await supabase
        .from('place_yourself')
        .insert({
          user_id: currentUserId,
          group_id: selectedGroup.id,
          group_code: selectedGroup.invite_code,
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
    } catch (err: any) {
      console.error('Error saving self placement:', err)
      throw new Error(err.message || 'Failed to save your placement')
    }
  }

  // Save others placements
  const saveOthersPlacement = async () => {
    if (!selectedGroup || !currentUserId) {
      throw new Error('Missing user or group information')
    }
    
    try {
      for (const token of tokens) {
        const { error: saveError } = await supabase
          .from('place_others')
          .insert({
            placer_user_id: currentUserId,
            placed_user_id: token.id,
            group_id: selectedGroup.id,
            group_code: selectedGroup.invite_code,
            username: token.firstName,
            first_name: token.firstName,
            position_x: token.position.x,
            position_y: token.position.y,
            top_label: 'Wet Sock',
            bottom_label: 'Dry Tongue',
            left_label: 'Tree Hugger',
            right_label: 'Lumberjack',
            created_at: new Date().toISOString()
          })
        
        if (saveError) {
          console.error(`Error saving position for ${token.firstName}:`, saveError)
        }
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