'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'

interface UserGroup {
  id: string
  name: string
  invite_code: string
  role: string
  created_by: string
}

export default function SuggestAxis() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupIdFromUrl = searchParams.get('groupId')
  
  const [topLabel, setTopLabel] = useState('')
  const [bottomLabel, setBottomLabel] = useState('')
  const [leftLabel, setLeftLabel] = useState('')
  const [rightLabel, setRightLabel] = useState('')
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [currentGroup, setCurrentGroup] = useState<UserGroup | null>(null)
  const [loading, setLoading] = useState(true)
  
  // NEW: State for the written norm modal
  const [showNormModal, setShowNormModal] = useState(true)
  const [hasAcknowledgedNorm, setHasAcknowledgedNorm] = useState(false)

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

        console.log("📍 Loading group from URL:", groupIdFromUrl)

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

        console.log("✅ Loaded group:", currentGroupData.name)
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

  // NEW: Handle norm acknowledgment
  const handleAcknowledgeNorm = () => {
    setHasAcknowledgedNorm(true)
    setShowNormModal(false)
  }

  // NEW: Handle declining norm (redirect to home)
  const handleDeclineNorm = () => {
    router.push('/home')
  }

  const handleSubmit = async () => {
    if (!hasAcknowledgedNorm) {
      setError('Please acknowledge the community guidelines first.')
      return
    }

    if (!topLabel || !bottomLabel || !leftLabel || !rightLabel) {
      setError('Please fill out all axes labels.')
      return
    }

    if (!currentGroup || !currentUser) {
      setError('Group or user information not available.')
      return
    }

    try {
      console.log('💾 Saving axis recommendation to database...')
      
      // Insert directly into Supabase
      const { data, error } = await supabase
        .from('axis_recommendations')
        .insert({
          group_id: currentGroup.id,
          suggested_by: currentUser.id,
          top_label: topLabel,
          bottom_label: bottomLabel,
          left_label: leftLabel,
          right_label: rightLabel
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw new Error('Failed to save axis recommendation')
      }

      console.log('✅ Axis recommendation saved:', data.id)
      
      // Success! Clear form and redirect
      setTopLabel('')
      setBottomLabel('')
      setLeftLabel('')
      setRightLabel('')
      setError('')
      
      // Show success message or redirect
      alert('Axis suggestion submitted successfully!')
      router.push('/home')

    } catch (err: any) {
      console.error('Error saving recommendation:', err)
      setError(err.message || 'Failed to save axis recommendation')
    }
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
    <>
      <main className="relative flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
        {/* Arrow back button top-left absolute */}
        <button
          onClick={() => router.push('/home')}
          aria-label="Go back to home"
          className="absolute top-4 left-4 text-4xl font-black text-black hover:text-gray-700 transition"
          style={{ fontFamily: 'Arial Black, Arial, sans-serif', lineHeight: 1 }}
        >
          ←
        </button>

        <div className="w-full max-w-sm">
          {/* Show current group info like other pages */}
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg mb-2">Suggesting Axes For:</h3>
            <div className="flex justify-between items-center">
              <span className="font-medium">{currentGroup.name}</span>
              <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                CURRENT GROUP
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
            <h1
              className="text-4xl font-black text-center"
              style={{
                textShadow:
                  '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                color: 'white',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              SEND AXES
            </h1>
          </div>

          {/* NEW: Show norm acknowledgment status */}
          {hasAcknowledgedNorm && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-6">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-green-800 text-sm font-medium">
                  Community guidelines acknowledged
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
              {error}
            </div>
          )}

          <div className={`space-y-4 ${!hasAcknowledgedNorm ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top of Y-axis
              </label>
              <input
                type="text"
                placeholder="e.g., Morning Person"
                value={topLabel}
                onChange={(e) => setTopLabel(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition"
                disabled={!hasAcknowledgedNorm}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bottom of Y-axis
              </label>
              <input
                type="text"
                placeholder="e.g., Night Owl"
                value={bottomLabel}
                onChange={(e) => setBottomLabel(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition"
                disabled={!hasAcknowledgedNorm}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Left of X-axis
              </label>
              <input
                type="text"
                placeholder="e.g., Coffee Lover"
                value={leftLabel}
                onChange={(e) => setLeftLabel(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition"
                disabled={!hasAcknowledgedNorm}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Right of X-axis
              </label>
              <input
                type="text"
                placeholder="e.g., Tea Enthusiast"
                value={rightLabel}
                onChange={(e) => setRightLabel(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition"
                disabled={!hasAcknowledgedNorm}
              />
            </div>
          </div>

          <div className="flex justify-center mt-8">
            {!hasAcknowledgedNorm ? (
              <button
                onClick={() => setShowNormModal(true)}
                className="bg-gray-400 py-3 px-10 rounded-full"
              >
                <span
                  className="text-xl font-black"
                  style={{
                    textShadow:
                      '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                    color: 'white',
                    fontFamily: 'Arial, sans-serif'
                  }}
                >
                  Read Guidelines First
                </span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!topLabel || !bottomLabel || !leftLabel || !rightLabel}
                className="bg-[#60A5FA] py-3 px-10 rounded-full disabled:opacity-50 hover:bg-[#3B82F6] transition"
              >
                <span
                  className="text-xl font-black"
                  style={{
                    textShadow:
                      '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                    color: 'white',
                    fontFamily: 'Arial, sans-serif'
                  }}
                >
                  Submit Axes
                </span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* NEW: Community Guidelines Modal */}
      {showNormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl p-8 mx-4 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Community Guidelines
              </h2>
              <div className="text-6xl mb-4">🌟</div>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-gray-700 text-lg leading-relaxed font-medium">
                Please ensure your axis will foster <strong>positivity</strong>, encouraging <strong>appreciation</strong> and <strong>collective celebration</strong> of all.
              </p>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              <p className="mb-3">By acknowledging these guidelines, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Create axes that celebrate diversity and individual strengths</li>
                <li>Avoid content that could make anyone feel excluded or judged</li>
                <li>Focus on positive traits and characteristics</li>
                <li>Help build an inclusive and supportive community</li>
              </ul>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDeclineNorm}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAcknowledgeNorm}
                className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-600 transition"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}