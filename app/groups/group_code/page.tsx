'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'

interface UserGroup {
  id: string
  name: string
  invite_code: string
  role: string
  created_by: string
}

function GroupCodeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupIdFromUrl = searchParams.get('group_id') // Changed to match other components
  
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [currentGroup, setCurrentGroup] = useState<UserGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    const fetchCurrentGroup = async () => {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("Error fetching user:", userError)
          router.push('/login')
          return
        }
        setCurrentUser(user)

        // If no group ID in URL, redirect to home
        if (!groupIdFromUrl) {
          console.log("No group ID provided, redirecting to home")
          router.push("/home")
          return
        }

        console.log("📍 Loading group code for group:", groupIdFromUrl)

        // Get user's membership in the specified group
        const { data: membership, error: memErr } = await supabase
          .from("group_members")
          .select("group_id, role")
          .eq("user_id", user.id)
          .eq("group_id", groupIdFromUrl)
          .single()

        if (memErr || !membership) {
          console.error("User not member of this group:", memErr)
          router.push("/home")
          return
        }

        // Get the group details
        const { data: groupData, error: groupErr } = await supabase
          .from("groups")
          .select("id, name, invite_code, created_by")
          .eq("id", groupIdFromUrl)
          .single()

        if (groupErr || !groupData) {
          console.error("Error fetching group:", groupErr)
          router.push("/home")
          return
        }

        const currentGroupData: UserGroup = {
          id: groupData.id,
          name: groupData.name,
          invite_code: groupData.invite_code,
          role: membership.role,
          created_by: groupData.created_by,
        }

        console.log("✅ Loaded group for invite:", currentGroupData.name)
        setCurrentGroup(currentGroupData)

      } catch (error) {
        console.error("Error in fetchCurrentGroup:", error)
        router.push("/home")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCurrentGroup()
  }, [router, groupIdFromUrl])
  
  const copyToClipboard = () => {
    if (currentGroup?.invite_code) {
      navigator.clipboard.writeText(currentGroup.invite_code)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(err => {
          console.error('Failed to copy:', err)
        })
    }
  }
  
  const handleDone = () => {
    router.push('/home')
  }
  
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  if (!currentUser || !currentGroup) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Group not found</div>
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

        {/* Show current group info */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-lg mb-2">Invite Friends To:</h3>
          <div className="flex justify-between items-center">
            <span className="font-medium">{currentGroup.name}</span>
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
              CURRENT GROUP
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{ 
              textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              color: 'white',
              fontFamily: 'Arial, sans-serif'
          }}>
          SHARE CODE
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Group Code Display */}
          <div className="space-y-4">
            <div className="text-center">
              <label className="block text-2xl font-bold mb-4" style={{ 
                fontFamily: 'Arial, sans-serif'
              }}>
                Share this code with friends:
              </label>
            </div>
            
            <div 
              className="w-full px-6 py-8 border-4 border-black rounded-xl bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
              onClick={copyToClipboard}
            >
              <span className="text-5xl font-black text-center tracking-widest" style={{ 
                fontFamily: 'Arial, sans-serif'
              }}>
                {currentGroup.invite_code}
              </span>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={copyToClipboard}
                className="bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 transition flex items-center gap-2"
              >
                📋 {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            
            {copied && (
              <div className="text-green-600 text-center font-bold text-lg">
                ✅ Copied to clipboard!
              </div>
            )}
            
            <p className="text-sm text-center text-gray-600 mt-4">
              Friends can enter this code to join <strong>{currentGroup.name}</strong>
            </p>
          </div>
        </div>
        
        {/* Done Button */}
        <div className="flex justify-center mt-16">
          <button
            onClick={handleDone}
            className="bg-[#60A5FA] py-3 px-10 rounded-full hover:bg-[#3B82F6] transition"
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

export default function GroupCode() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    }>
      <GroupCodeContent />
    </Suspense>
  )
}