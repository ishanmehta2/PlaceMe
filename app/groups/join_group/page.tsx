'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'

interface GroupInfo {
  id: string
  name: string
  invite_code: string
}

export default function JoinGroup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupIdFromUrl = searchParams.get('groupId')
  
  const [inviteCode, setInviteCode] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null)
  const [showingInviteCode, setShowingInviteCode] = useState(false)

  // Get authenticated user and group info on component mount
  useEffect(() => {
    const getInitialData = async () => {
      try {
        setInitialLoading(true)
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        
        if (!user) {
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

        // If group ID is provided in URL, fetch the group info
        if (groupIdFromUrl) {
          console.log('📍 Loading group info for invite:', groupIdFromUrl)
          
          // Verify user is a member of this group
          const { data: membership, error: memberError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id)
            .eq('group_id', groupIdFromUrl)
            .single()

          if (!memberError && membership) {
            // User is a member, get group details
            const { data: group, error: groupError } = await supabase
              .from('groups')
              .select('id, name, invite_code')
              .eq('id', groupIdFromUrl)
              .single()

            if (!groupError && group) {
              setGroupInfo(group)
              setInviteCode(group.invite_code)
              setShowingInviteCode(true)
              console.log('✅ Group info loaded:', group.name)
            }
          }
        }
        
      } catch (err) {
        console.error('Error getting initial data:', err)
      } finally {
        setInitialLoading(false)
      }
    }
    
    getInitialData()
  }, [router, groupIdFromUrl])

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
          joined_at: new Date().toISOString()
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

  const copyInviteCode = async () => {
    if (groupInfo?.invite_code) {
      try {
        await navigator.clipboard.writeText(groupInfo.invite_code)
        // You could add a toast notification here
        alert('Invite code copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy:', err)
      }
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
        {/* Back Button */}
        <button
          onClick={() => router.push('/home')}
          aria-label="Go back to home"
          className="absolute top-4 left-4 text-4xl font-black text-black hover:text-gray-700 transition"
          style={{ fontFamily: 'Arial Black, Arial, sans-serif', lineHeight: 1 }}
        >
          ←
        </button>

        {/* Show group info if displaying invite code */}
        {showingInviteCode && groupInfo && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg mb-2">Invite Friends To:</h3>
            <div className="flex justify-between items-center">
              <span className="font-medium">{groupInfo.name}</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                CURRENT GROUP
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            {showingInviteCode ? 'SHARE CODE' : 'JOIN GROUP'}
          </h1>
        </div>

        {/* Show invite code if we have group info */}
        {showingInviteCode && groupInfo ? (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg mb-4">Share this code with friends:</p>
              
              <div className="bg-white border-4 border-black rounded-xl p-6 mb-4">
                <div className="text-4xl font-black text-center mb-2" style={{ 
                  fontFamily: 'Arial, sans-serif',
                  letterSpacing: '0.2em'
                }}>
                  {groupInfo.invite_code}
                </div>
              </div>

              <button
                onClick={copyInviteCode}
                className="bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 transition mb-4"
              >
                📋 Copy Code
              </button>

              <p className="text-sm text-gray-600">
                Friends can enter this code to join {groupInfo.name}
              </p>
            </div>
          </div>
        ) : (
          /* Regular join form */
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
        )}
      </div>
    </main>
  )
}