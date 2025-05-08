'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../../lib/auth/supabase'

export default function InviteMembers() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('group_id')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    if (!groupId) {
      setError('No group ID provided')
      return
    }
    
    // Generate a random 6-character invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setInviteCode(code)
    
    // Update the group with the invite code
    const updateGroup = async () => {
      try {
        const { error: updateError } = await supabase
          .from('groups')
          .update({ invite_code: code })
          .eq('id', groupId)
        
        if (updateError) throw updateError
      } catch (err: any) {
        console.error('Error updating group:', err)
        setError(err.message || 'Failed to generate invite code')
      }
    }
    
    updateGroup()
  }, [groupId])
  
  const handleFinish = () => {
    router.push(`/groups/view?id=${groupId}`)
  }

  const handleCopy = async () => {
    if (!inviteCode) return
    
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm">
        {/* Header with Invite Members text */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Invite Members
          </h1>
        </div>
        
        {/* Step indicator */}
        <div className="bg-[#FFE082] py-2 px-6 rounded-full w-fit mb-6">
          <h2 className="text-2xl font-bold" style={{ 
            fontFamily: 'Arial, sans-serif'
          }}>
            Step 2. INVITE friends
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}
        
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
                  {inviteCode || 'Generating...'}
                </span>
                <button
                  onClick={handleCopy}
                  disabled={!inviteCode || copied}
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
              Share this code with your friends so they can join your group!
            </p>
          </div>
        </div>
        
        {/* Finish Button */}
        <div className="flex justify-center mt-16">
          <button
            onClick={handleFinish}
            disabled={loading}
            className="bg-[#60A5FA] py-3 px-8 rounded-full w-64 active:bg-[#3B82F6] transition-colors"
          >
            <span className="text-3xl font-black" style={{ 
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              color: 'white',
              fontFamily: 'Arial, sans-serif'
            }}>
              {loading ? 'loading...' : 'finish'}
            </span>
          </button>
        </div>
      </div>
    </main>
  )
} 