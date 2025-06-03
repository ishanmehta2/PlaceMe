'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../../lib/auth/supabase'

interface Group {
  id: string
  name: string
  invite_code: string
}

function InviteMembersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId') // Updated to match the URL parameter
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) {
        setError('No group ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log('🔍 Fetching group data for ID:', groupId)

        // Get the authenticated user first to verify access
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("Error fetching user:", userError)
          router.push('/login')
          return
        }

        // Check if user is a member of this group
        const { data: membership, error: membershipError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .eq('group_id', groupId)
          .single()

        if (membershipError || !membership) {
          console.error("User not a member of this group:", membershipError)
          setError('You are not a member of this group')
          setLoading(false)
          return
        }

        // Fetch the group data including invite code
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('id, name, invite_code')
          .eq('id', groupId)
          .single()
        
        if (groupError) {
          console.error('Error fetching group:', groupError)
          throw groupError
        }

        if (!groupData) {
          throw new Error('Group not found')
        }

        console.log('✅ Found group:', groupData.name, 'with invite code:', groupData.invite_code)
        setGroup(groupData)

      } catch (err: any) {
        console.error('Error fetching group:', err)
        setError(err.message || 'Failed to load group information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchGroup()
  }, [groupId, router])
  
  const handleFinish = () => {
    router.push('/home') // Navigate back to home instead of group view
  }

  const handleCopy = async () => {
    if (!group?.invite_code) return
    
    try {
      await navigator.clipboard.writeText(group.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading group...</div>
      </main>
    )
  }

  // Error state
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/home')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Go Back Home
        </button>
      </main>
    )
  }

  // Missing group state
  if (!group) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Group not found</div>
        <button
          onClick={() => router.push('/home')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg mt-4"
        >
          Go Back Home
        </button>
      </main>
    )
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      {/* Back arrow button */}
      <button
        onClick={() => router.push('/home')}
        aria-label="Go back to home"
        className="absolute top-4 left-4 text-4xl font-black text-black hover:text-gray-700 transition"
        style={{ fontFamily: 'Arial Black, Arial, sans-serif', lineHeight: 1 }}
      >
        ←
      </button>

      <div className="w-full max-w-sm">
        {/* Show current group info */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-lg mb-2">Inviting Members To:</h3>
          <div className="flex justify-between items-center">
            <span className="font-medium">{group.name}</span>
            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
              YOUR GROUP
            </span>
          </div>
        </div>

        {/* Header with Invite Members text */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            INVITE MEMBERS
          </h1>
        </div>
        
        <div className="space-y-8">
          {/* Invite Code Display */}
          <div className="space-y-4">
            <h3 className="text-3xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Share this code:
            </h3>
            
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black tracking-wider" style={{ 
                  fontFamily: 'Arial, sans-serif'
                }}>
                  {group.invite_code}
                </span>
                <button
                  onClick={handleCopy}
                  disabled={copied}
                  className="ml-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <p className="text-lg text-center" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Share this code with your friends so they can join <strong>{group.name}</strong>!
            </p>
          </div>
        </div>
        
        {/* Finish Button */}
        <div className="flex justify-center mt-16">
          <button
            onClick={handleFinish}
            className="bg-[#60A5FA] py-3 px-8 rounded-full w-64 hover:bg-[#3B82F6] transition-colors"
          >
            <span className="text-3xl font-black" style={{ 
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              color: 'white',
              fontFamily: 'Arial, sans-serif'
            }}>
              Done
            </span>
          </button>
        </div>
      </div>
    </main>
  )
}

export default function InviteMembers() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading group...</div>
      </main>
    }>
      <InviteMembersContent />
    </Suspense>
  )
}