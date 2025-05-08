'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/auth/supabase'

export default function CreateGroup() {
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
  const [canPlaceOthers, setCanPlaceOthers] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleNext = async () => {
    if (!groupName.trim()) {
      setError('Group name is required')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to create a group')
      }
      
      // Create a new group in the database
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([
          { 
            name: groupName,
            created_by: user.id,
            settings: {
              can_place_others: canPlaceOthers
            }
          }
        ])
        .select()
      
      if (groupError) throw groupError
      
      // Add the creator as a member of the group
      if (group && group.length > 0) {
        const { error: memberError } = await supabase
          .from('group_members')
          .insert([
            { 
              group_id: group[0].id,
              user_id: user.id,
              role: 'admin'
            }
          ])
        
        if (memberError) throw memberError
        
        // Redirect to the group code page to share with friends
        router.push(`/groups/group_code?group_id=${group[0].id}`)
      }
    } catch (err: any) {
      console.error('Error creating group:', err)
      setError(err.message || 'Failed to create group')
    } finally {
      setLoading(false)
    }
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
            Step 1. BORING info
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-8">
          {/* Group Name Input */}
          <div className="space-y-2">
            <label htmlFor="groupName" className="block text-5xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Group Name:
            </label>
            <input
              id="groupName"
              name="groupName"
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-lg text-xl"
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
          </div>
          
          {/* Settings Section */}
          <div className="space-y-4">
            <h3 className="text-5xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Settings:
            </h3>
            
            <div className="flex items-start space-x-4">
              <div 
                className={`w-10 h-10 border-2 border-black rounded flex items-center justify-center cursor-pointer ${canPlaceOthers ? 'bg-white' : 'bg-white'}`}
                onClick={() => setCanPlaceOthers(!canPlaceOthers)}
              >
                {canPlaceOthers && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              <div>
                <label className="text-2xl font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
                  place others*
                </label>
                <p className="text-sm mt-1" style={{ fontFamily: 'Arial, sans-serif' }}>
                  *members of your group can<br />
                  guess where other members<br />
                  place themselves
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Next Button */}
        <div className="flex justify-center mt-16">
          <button
            onClick={handleNext}
            disabled={loading}
            className="bg-[#60A5FA] py-3 px-10 rounded-full"
          >
            <span className="text-4xl font-black" style={{ 
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              color: 'white',
              fontFamily: 'Arial, sans-serif'
            }}>
              {loading ? 'loading...' : 'next'}
            </span>
          </button>
        </div>
      </div>
    </main>
  )
}