// hooks/useResults.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'

interface ResultToken {
  user_id: string
  username: string
  avatar_url: string
  color: string
  x: number
  y: number
}

interface IndividualGuess {
  guesser_id: string
  guesser_name: string
  guesser_avatar: string
  position: { x: number; y: number }
}

interface GuessedResult {
  user_id: string
  username: string
  avatar_url: string
  color: string
  averagePosition: { x: number; y: number }
  individualGuesses: IndividualGuess[]
}

interface GroupResults {
  selfPlaced: ResultToken[]
  guessed: GuessedResult[]
}

// Colors for members (consistent assignment)
const getMemberColor = (index: number): string => {
  const colors = [
    '#EF4444', // Red
    '#10B981', // Green  
    '#A855F7', // Purple
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#F97316', // Orange
  ]
  
  return colors[index % colors.length]
}

export const useResults = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [results, setResults] = useState<GroupResults>({
    selfPlaced: [],
    guessed: []
  })

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        
        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("Error fetching user:", userError)
          router.push('/login')
          return
        }
        
        setCurrentUserId(user.id)
        
        // Get workflow group from session storage
        const groupId = sessionStorage.getItem('workflowGroupId')
        const groupName = sessionStorage.getItem('workflowGroupName')
        const groupCode = sessionStorage.getItem('workflowGroupCode')
        
        if (!groupId) {
          setError('No active workflow group. Please start from place yourself.')
          return
        }
        
        setSelectedGroup({
          id: groupId,
          name: groupName,
          invite_code: groupCode
        })
        
        // Fetch self placements (where everyone placed themselves)
        const { data: selfPlacements, error: selfError } = await supabase
          .from('place_yourself')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false }) // Get most recent placements
        
        if (selfError) {
          console.error('Error fetching self placements:', selfError)
        }
        
        // Fetch guessed placements (where others placed the current user)
        const { data: guessedPlacements, error: guessedError } = await supabase
          .from('place_others')
          .select('*')
          .eq('group_id', groupId)
          .eq('placed_user_id', user.id) // Where others placed the current user
          .order('created_at', { ascending: false })
        
        if (guessedError) {
          console.error('Error fetching guessed placements:', guessedError)
        }
        
        // Get group members for avatars and names
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
          
        if (membersError) {
          console.error("Error fetching group members:", membersError)
        }
        
        // Get profiles for all members
        const memberUserIds = membersData?.map(member => member.user_id) || []
        
        let profiles = []
        if (memberUserIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', memberUserIds)
            
          if (profilesError) {
            console.error("Error fetching profiles:", profilesError)
          } else {
            profiles = profilesData || []
          }
        }
        
        // Process self placements - get most recent for each user
        const selfPlacedMap = new Map()
        selfPlacements?.forEach(placement => {
          if (!selfPlacedMap.has(placement.user_id)) {
            const profile = profiles.find(p => p.id === placement.user_id)
            selfPlacedMap.set(placement.user_id, {
              user_id: placement.user_id,
              username: placement.first_name || profile?.name || 'Unknown',
              avatar_url: profile?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50)}`,
              color: getMemberColor(selfPlacedMap.size),
              x: placement.position_x,
              y: placement.position_y
            })
          }
        })
        
        // Process guessed placements (where others placed current user)
        const guessedResult: GuessedResult[] = []
        
        if (guessedPlacements && guessedPlacements.length > 0) {
          // Get individual guesses with guesser info
          const individualGuesses: IndividualGuess[] = []
          let totalX = 0
          let totalY = 0
          
          for (const placement of guessedPlacements) {
            const guesserProfile = profiles.find(p => p.id === placement.placer_user_id)
            
            individualGuesses.push({
              guesser_id: placement.placer_user_id,
              guesser_name: guesserProfile?.name || 'Unknown',
              guesser_avatar: guesserProfile?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50)}`,
              position: { x: placement.position_x, y: placement.position_y }
            })
            
            totalX += placement.position_x
            totalY += placement.position_y
          }
          
          // Calculate average position
          const averageX = totalX / guessedPlacements.length
          const averageY = totalY / guessedPlacements.length
          
          // Get current user's profile for the guessed result
          const currentUserProfile = profiles.find(p => p.id === user.id)
          
          guessedResult.push({
            user_id: user.id,
            username: currentUserProfile?.name || 'You',
            avatar_url: currentUserProfile?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50)}`,
            color: getMemberColor(0),
            averagePosition: { x: averageX, y: averageY },
            individualGuesses
          })
        }
        
        setResults({
          selfPlaced: Array.from(selfPlacedMap.values()),
          guessed: guessedResult
        })
        
      } catch (err: any) {
        console.error('Error fetching results:', err)
        setError(err.message || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }
    
    fetchResults()
  }, [router])

  return {
    loading,
    error,
    currentUserId,
    selectedGroup,
    results
  }
}