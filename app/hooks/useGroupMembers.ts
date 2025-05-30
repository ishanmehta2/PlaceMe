// hooks/useGroupMembers.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'
import { DEFAULTS } from '../utils/constants'

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
    
    const x = Math.max(DEFAULTS.TOKEN_SIZE/2, Math.min(DEFAULTS.AXIS_WIDTH - DEFAULTS.TOKEN_SIZE/2, centerX + Math.cos(angle) * radius))
    const y = Math.max(18, Math.min(282, centerY + Math.sin(angle) * radius))
    
    positions.push({ x, y })
  }
  
  return positions
}

export const useGroupMembers = () => {
  const router = useRouter()
  const [tokens, setTokens] = useState<UserToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Fetch user groups and randomly select one
  useEffect(() => {
    const fetchUserGroupsAndSelect = async () => {
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
        
        // Randomly select one group for place others
        const randomIndex = Math.floor(Math.random() * formattedGroups.length)
        const randomGroup = formattedGroups[randomIndex]
        setSelectedGroup(randomGroup)
        
        // Fetch members for the randomly selected group
        await fetchGroupMembers(randomGroup.id, user.id)
        
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load group data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserGroupsAndSelect()
  }, [router])

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
      
      // Transform member data and filter out current user
      const allGroupMembers = membersData.map((member, index) => {
        const profile = profiles.find(p => p.id === member.user_id)
        return {
          user_id: member.user_id,
          username: profile?.name || `User ${index + 1}`,
          avatar_url: profile?.avatar_url || `https://i.pravatar.cc/150?img=${index + 1}`,
          role: member.role
        }
      })
      
      // Filter out the current user and convert to UserToken format
      const otherMembers = allGroupMembers.filter(member => member.user_id !== currentUserId)
      const initialPositions = calculateInitialPositions(otherMembers.length)
      
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

  // Handle position changes
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

  // Save positions to database
  const savePositions = async () => {
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
      console.error('Error saving positions:', err)
      throw new Error(err.message || 'Failed to save user positions')
    }
  }

  return {
    tokens,
    loading,
    error,
    userGroups,
    selectedGroup,
    handlePositionChange,
    savePositions
  }
}