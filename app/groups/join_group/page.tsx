'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'

export default function JoinGroup() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get authenticated user on component mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        
        if (!user) {
          // Redirect to login if not authenticated
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
        
        if (!profileError && profile) {
          // Store user info in sessionStorage
          sessionStorage.setItem('currentUserId', user.id)
          sessionStorage.setItem('currentUserEmail', user.email || '')
          sessionStorage.setItem('currentUserName', profile.username || profile.full_name || user.email || '')
          
          const firstName = profile.full_name 
            ? profile.full_name.split(' ')[0] 
            : (profile.username || user.email?.split('@')[0] || 'User')
            
          sessionStorage.setItem('currentFirstName', firstName)
          
          if (profile.avatar_url) {
            sessionStorage.setItem('currentUserAvatar', profile.avatar_url)
          }
        }
      } catch (err) {
        console.error('Error getting user:', err)
      } finally {
        setInitialLoading(false)
      }
    }
    
    getUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteCode.trim()) {
      setError('Please enter an invite code')
      return
    }
    
    if (!userId) {
      setError('You must be logged in to join a group')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Find the group with this invite code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', inviteCode.trim())
        .single()
      
      if (groupError) {
        if (groupError.code === 'PGRST116') {
          throw new Error('Invalid invite code. Please check and try again.')
        }
        throw groupError
      }
      
      if (!group) {
        throw new Error('Group not found. Please check the invite code and try again.')
      }
      
      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .single()
      
      if (!memberCheckError && existingMember) {
        // User is already a member, just proceed to Place Yourself
        sessionStorage.setItem('currentGroupId', group.id)
        sessionStorage.setItem('currentGroupCode', group.invite_code)
        sessionStorage.setItem('currentGroupName', group.name)
        
        router.push('/groups/place_yourself')
        return
      }
      
      // Add user to the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: 'member',
          created_at: new Date().toISOString()
        })
      
      if (joinError) throw joinError
      
      // Store group info in session storage
      sessionStorage.setItem('currentGroupId', group.id)
      sessionStorage.setItem('currentGroupCode', group.invite_code)
      sessionStorage.setItem('currentGroupName', group.name)
      
      // Redirect to Place Yourself instead of home
      router.push('/groups/place_yourself')
    } catch (err: any) {
      console.error('Error joining group:', err)
      setError(err.message || 'Failed to join group')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm">
        {/* Header with Join Group text */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Join Group
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="inviteCode" className="block text-3xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Enter Invite Code:
            </label>
            
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-4 py-4 border-2 border-black rounded-lg text-2xl text-center uppercase"
              placeholder="XXXXXX"
              maxLength={10}
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
            
            <p className="text-sm text-center mt-2">
              Enter the 6-digit code shared by your friend.
            </p>
          </div>
          
          {/* Join Button */}
          <div className="flex justify-center mt-10">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#60A5FA] py-3 px-10 rounded-full"
            >
              <span className="text-2xl font-black" style={{ 
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                color: 'white',
                fontFamily: 'Arial, sans-serif'
              }}>
                {loading ? 'Joining...' : 'Join Group'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}