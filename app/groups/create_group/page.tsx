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

// Function to create initial axis for a new group
const createInitialAxisForGroup = async (groupId: string): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('🆕 Creating initial axis for new group:', groupId);
    
    // Check if axis already exists for today (shouldn't happen for new groups, but safety check)
    const { data: existingAxis, error: existingError } = await supabase
      .from('axes')
      .select('id')
      .eq('group_id', groupId)
      .eq('date_generated', today)
      .eq('is_active', true)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing axis:', existingError);
      return false;
    }

    if (existingAxis) {
      console.log('✅ Axis already exists for this group today:', existingAxis.id);
      return true;
    }

    // Import axis generation functions dynamically
    const { getTwoDifferentAxisPairs } = await import('../../data/axisPairs');
    
    // Generate fresh axis pairs for the new group
    const { vertical: verticalPair, horizontal: horizontalPair } = getTwoDifferentAxisPairs();

    console.log('✨ Generated axis pairs for new group:');
    console.log('  Vertical:', verticalPair.left, 'vs', verticalPair.right);
    console.log('  Horizontal:', horizontalPair.left, 'vs', horizontalPair.right);

    // Insert new axis into database
    const { data: newAxis, error: insertError } = await supabase
      .from('axes')
      .insert({
        group_id: groupId,
        vertical_axis_pair_id: verticalPair.id,
        horizontal_axis_pair_id: horizontalPair.id,
        left_label: horizontalPair.left,
        right_label: horizontalPair.right,
        top_label: verticalPair.left,
        bottom_label: verticalPair.right,
        date_generated: today,
        is_active: true
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Error creating initial axis for group:', insertError);
      return false;
    }

    console.log('✅ Successfully created initial axis for group:', newAxis.id);
    return true;
    
  } catch (err: any) {
    console.error('❌ Error in createInitialAxisForGroup:', err);
    return false;
  }
}

export default function CreateGroup() {
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModeratorPopup, setShowModeratorPopup] = useState(false)
  const [hasAcknowledged, setHasAcknowledged] = useState(false)

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
    
    // Show moderator acknowledgment popup before creating group
    setShowModeratorPopup(true)
  }

  const proceedWithGroupCreation = async () => {
    if (!hasAcknowledged) {
      setError('You must acknowledge your responsibilities as a moderator')
      return
    }
    
    setLoading(true)
    setError(null)
    setShowModeratorPopup(false)
    
    try {
      // Generate a unique invite code
      const inviteCode = generateGroupCode()
      
      console.log('🔄 Creating group with:', {
        name: groupName.trim(),
        inviteCode,
        createdBy: userId
      })
      
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
      
      if (groupError) {
        console.error('❌ Group creation error:', groupError)
        throw groupError
      }
      
      if (!newGroup || !newGroup.id) {
        throw new Error('Failed to create group - no ID returned')
      }
      
      console.log('✅ Group created successfully:', newGroup)
      
      // Add the creator as a member of the group
      console.log('🔄 Adding creator as member:', {
        groupId: newGroup.id,
        userId: userId,
        role: 'admin'
      })
      
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: userId,
          role: 'admin', // Only 'admin' or 'member' are allowed
          joined_at: new Date().toISOString()
        })
        .select()
      
      if (memberError) {
        console.error('❌ Error adding creator as member:', memberError)
        console.error('❌ Full error details:', JSON.stringify(memberError, null, 2))
        
        // This is critical - if we can't add the creator, the flow breaks
        // Let's try to clean up by deleting the group
        await supabase.from('groups').delete().eq('id', newGroup.id)
        throw new Error(`Failed to add you as group member: ${memberError.message || 'Unknown error'}`)
      }
      
      console.log('✅ Creator added as member successfully:', memberData)
      
      // Verify the membership was created
      const { data: verifyMembership, error: verifyError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', newGroup.id)
        .eq('user_id', userId)
        .single()
      
      if (verifyError || !verifyMembership) {
        console.error('❌ Failed to verify membership:', verifyError)
        throw new Error('Group created but membership verification failed')
      }
      
      console.log('✅ Membership verified:', verifyMembership)
      
      // Create initial axis for the new group
      console.log('🎯 Creating initial axis for new group...')
      const axisCreated = await createInitialAxisForGroup(newGroup.id)
      
      if (!axisCreated) {
        console.warn('⚠️ Failed to create initial axis, but continuing with group creation')
        // Don't fail the entire group creation if axis creation fails
        // The home page will handle creating an axis later if needed
      } else {
        console.log('✅ Initial axis created successfully for new group')
      }
      
      // Store group info in session storage
      sessionStorage.setItem('currentGroupId', newGroup.id)
      sessionStorage.setItem('currentGroupCode', inviteCode)
      sessionStorage.setItem('currentGroupName', groupName.trim())
      
      console.log('🔄 Redirecting to group code page...')
      
      // Redirect to the group code page with the group ID
      router.push(`/groups/group_code?group_id=${newGroup.id}`)
    } catch (err: any) {
      console.error('❌ Error creating group:', err)
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

      {/* Moderator Responsibilities Popup */}
      {showModeratorPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          onClick={() => {}} // Prevent closing by clicking outside
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
              🎉 You are now the moderator of {groupName}!
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Your responsibilities are as follows:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Maintain a respectful, encouraging environment where all members feel celebrated.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Prohibit contributions that may feel hateful and targeting.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Promote positive usage of the axes, creating meaningful and fun exchanges.</span>
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">To help you, you have the following tools:</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">1.</span>
                  <span>You may kick any member from this group. This may be done in the "Members Tab" located in the three-dot menu at the top of a group's home page.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">2.</span>
                  <span>You may view anonymous reports from other users.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">3.</span>
                  <span>You may delete previous axes. This can be done by selecting the trash can icon next to each axes on the home page.</span>
                </li>
              </ol>
            </div>

            <div className="mb-6">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <span className="text-sm font-medium">
                  I understand and acknowledge my responsibilities as a moderator of this group.
                </span>
              </label>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowModeratorPopup(false)
                  setHasAcknowledged(false)
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={proceedWithGroupCreation}
                disabled={!hasAcknowledged || loading}
                className={`px-6 py-2 rounded-lg font-bold text-white transition ${
                  hasAcknowledged && !loading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Creating Group...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}