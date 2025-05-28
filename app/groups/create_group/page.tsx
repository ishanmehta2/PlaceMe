'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'

// Function to generate a random group code
function generateGroupCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

export default function CreateGroup() {
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
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
        
        // Save user ID to session storage
        sessionStorage.setItem('currentUserId', user.id)
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!profileError && profile) {
          // Store user info in sessionStorage
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
    
    if (!groupName.trim()) {
      setError('Please enter a group name')
      return
    }
    
    if (!userId) {
      setError('You must be logged in to create a group')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Generate a unique invite code
      const inviteCode = generateGroupCode()
      
      // Create the group
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName.trim(),
          invite_code: inviteCode,
          created_by: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (groupError) throw groupError
      
      if (!newGroup || !newGroup.id) {
        throw new Error('Failed to create group')
      }
      
      // Add the creator as a member of the group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: userId,
          role: 'creator', // Mark as creator
          created_at: new Date().toISOString()
        })
      
      if (memberError) {
        console.error('Error adding creator as member:', memberError)
        // Continue anyway since the group was created
      }
      
      // Store group info in session storage
      sessionStorage.setItem('currentGroupId', newGroup.id)
      sessionStorage.setItem('currentGroupCode', inviteCode)
      sessionStorage.setItem('currentGroupName', groupName.trim())
      
      // Redirect to the group code page with the group ID
      router.push(`/groups/group_code?group_id=${newGroup.id}`)
    } catch (err: any) {
      console.error('Error creating group:', err)
      setError(err.message || 'Failed to create group')
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
        {/* Back Button */}
        <button
          onClick={() => router.push('/home')}
          aria-label="Go back to home"
          className="absolute top-4 left-4 text-4xl font-black text-black hover:text-gray-700 transition"
          style={{ fontFamily: 'Arial Black, Arial, sans-serif', lineHeight: 1 }}
        >
          ←
        </button>
    
        {/* Header with Create Group text */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Create Group
          </h1>
        </div>
        
        {/* Step indicator */}
        <div className="bg-[#FFE082] py-2 px-6 rounded-full w-fit mb-6">
          <h2 className="text-2xl font-bold" style={{ 
            fontFamily: 'Arial, sans-serif'
          }}>
            Step 1. Name your group!
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="groupName" className="block text-3xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Group Name:
            </label>
            
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-lg text-xl"
              placeholder="Enter group name..."
              maxLength={50}
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
          </div>
          
          {/* Create Button */}
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
                {loading ? 'Creating...' : 'Create Group'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}