'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'

export default function JoinGroup() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Invite code is required')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to join a group')
      }
      
      // Find the group by invite code
      const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', inviteCode)
        .limit(1)
      
      if (groupError) throw groupError
      
      if (!groups || groups.length === 0) {
        throw new Error('Invalid invite code')
      }
      
      const group = groups[0]
      
      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .limit(1)
      
      if (memberCheckError) throw memberCheckError
      
      if (existingMember && existingMember.length > 0) {
        throw new Error('You are already a member of this group')
      }
      
      // Add the user as a member
      const { error: joinError } = await supabase
        .from('group_members')
        .insert([
          { 
            group_id: group.id,
            user_id: user.id,
            role: 'member'
          }
        ])
      
      if (joinError) throw joinError
      
      // Redirect to the home page
      router.push('/home')
      
    } catch (err: any) {
      console.error('Error joining group:', err)
      setError(err.message || 'Failed to join group')
    } finally {
      setLoading(false)
    }
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
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-8">
          {/* Invite Code Input */}
          <div className="space-y-2">
            <label htmlFor="inviteCode" className="block text-4xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Enter Invite Code:
            </label>
            <input
              id="inviteCode"
              name="inviteCode"
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-lg text-xl"
              style={{ fontFamily: 'Arial, sans-serif' }}
              placeholder="XXXXXX"
            />
          </div>
          
          {/* Join Button */}
          <div className="flex justify-center mt-10">
            <button
              onClick={handleJoin}
              disabled={loading}
              className="bg-[#60A5FA] py-3 px-8 rounded-full"
            >
              <span className="text-4xl font-black" style={{ 
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                color: 'white',
                fontFamily: 'Arial, sans-serif'
              }}>
                {loading ? 'Joining...' : 'Join Now'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}