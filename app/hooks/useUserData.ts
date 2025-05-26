import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'

interface UserData {
  userName: string
  firstName: string
  userAvatar: string
  loading: boolean
  error: string | null
}

export function useUserData(): UserData {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [userAvatar, setUserAvatar] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        
        await handleGroupManagement(currentUserId)
      } catch (err: any) {
        console.error('Error fetching user data:', err)
        setError(err.message || 'Failed to load user data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [router, firstName])

  const handleGroupManagement = async (currentUserId: string) => {
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
      await handleNoGroupCase(currentUserId)
    }
  }

  const handleNoGroupCase = async (currentUserId: string) => {
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
      await handleGroupMembership(currentUserId)
    }
  }

  const handleGroupMembership = async (currentUserId: string) => {
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

  return { userName, firstName, userAvatar, loading, error }
} 