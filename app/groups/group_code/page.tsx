'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'

export default function GroupCode() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [groupCode, setGroupCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const groupId = searchParams.get('group_id')
        
        if (!groupId) {
          setError('No group ID provided')
          setLoading(false)
          return
        }
        
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single()
        
        if (groupError) throw groupError
        
        if (group) {
          setGroupCode(group.invite_code)
          setGroupName(group.name)
          
          // Store group info in sessionStorage for use in other pages
          sessionStorage.setItem('currentGroupId', group.id)
          sessionStorage.setItem('currentGroupName', group.name)
          sessionStorage.setItem('currentGroupCode', group.invite_code)
        } else {
          setError('Group not found')
        }
      } catch (err: any) {
        console.error('Error fetching group:', err)
        setError(err.message || 'Failed to load group details')
      } finally {
        setLoading(false)
      }
    }
    
    fetchGroupDetails()
  }, [searchParams])
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(groupCode)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(err => {
        console.error('Failed to copy:', err)
      })
  }
  
  // Modified to route to place_yourself instead of home
  const handleDone = () => {
    // Route to the first Place Yourself screen instead of home
    router.push(`/groups/place_yourself`)
  }
  
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm">
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
            Step 2. Invite friends!
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          {/* Group Code Display */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-4xl font-black" style={{ 
                fontFamily: 'Arial, sans-serif'
              }}>
                Group Code:
              </label>
              
              <button 
                onClick={copyToClipboard}
                className="p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            
            <div 
              className="w-full px-4 py-5 border-2 border-black rounded-lg bg-white flex items-center justify-center cursor-pointer"
              onClick={copyToClipboard}
            >
              <span className="text-4xl font-black text-center" style={{ 
                fontFamily: 'Arial, sans-serif'
              }}>
                {groupCode}
              </span>
            </div>
            
            {copied && (
              <div className="text-green-600 text-center font-medium">
                Copied to clipboard!
              </div>
            )}
            
            <p className="text-sm text-center mt-2">
              Share this code with friends so they can join your group.
            </p>
          </div>
        </div>
        
        {/* Done Button */}
        <div className="flex justify-center mt-16">
          <button
            onClick={handleDone}
            className="bg-[#60A5FA] py-3 px-10 rounded-full"
          >
            <span className="text-2xl font-black" style={{ 
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