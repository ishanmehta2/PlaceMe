// hooks/useResults.ts
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'
import { getUserAvatar } from '../lib/avatars'

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

interface DailyAxis {
  id: string
  group_id: string
  vertical_axis_pair_id: string
  horizontal_axis_pair_id: string
  left_label: string
  right_label: string
  top_label: string
  bottom_label: string
  date_generated: string
  is_active: boolean
  labels: {
    top: string
    bottom: string
    left: string
    right: string
    labelColors: {
      top: string
      bottom: string
      left: string
      right: string
    }
  }
}

interface Profile {
  id: string
  name: string
  avatar_url: string
}

interface Placement {
  placer_user_id: string
  placed_user_id: string
  created_at: string
  position_x: number
  position_y: number
  username: string
  first_name: string
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
  const [dailyAxis, setDailyAxis] = useState<DailyAxis | null>(null)
  const [results, setResults] = useState<GroupResults>({
    selfPlaced: [],
    guessed: []
  })

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        setError(null)
        
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
        
        console.log('📊 Loading results for group:', groupName, '(ID:', groupId, ')')

        // STEP 1: Get the current daily axis for this group
        const today = new Date().toISOString().split('T')[0]
        const { data: axisData, error: axisError } = await supabase
          .from('axes')
          .select('*')
          .eq('group_id', groupId)
          .eq('date_generated', today)
          .eq('is_active', true)
          .maybeSingle()

        if (axisError) {
          console.error('Error fetching daily axis:', axisError)
          setError('Failed to load daily axis data')
          return
        }

        if (!axisData) {
          console.warn('No daily axis found for today')
          setError('No axis data found for today. Please start a new workflow.')
          return
        }

        // Process axis data
        const processedAxis: DailyAxis = {
          id: axisData.id,
          group_id: axisData.group_id,
          vertical_axis_pair_id: axisData.vertical_axis_pair_id,
          horizontal_axis_pair_id: axisData.horizontal_axis_pair_id,
          left_label: axisData.left_label,
          right_label: axisData.right_label,
          top_label: axisData.top_label,
          bottom_label: axisData.bottom_label,
          date_generated: axisData.date_generated,
          is_active: axisData.is_active,
          labels: {
            top: axisData.top_label,
            bottom: axisData.bottom_label,
            left: axisData.left_label,
            right: axisData.right_label,
            labelColors: {
              // Default colors - could be enhanced to store these in database
              top: 'rgba(251, 207, 232, 0.95)', // Pink
              bottom: 'rgba(167, 243, 208, 0.95)', // Green
              left: 'rgba(221, 214, 254, 0.95)', // Purple
              right: 'rgba(253, 230, 138, 0.95)' // Yellow
            }
          }
        }

        setDailyAxis(processedAxis)
        console.log('✅ Loaded daily axis:', processedAxis.id)

        // STEP 2: Fetch self placements for this specific axis
        const { data: selfPlacements, error: selfError } = await supabase
          .from('place_yourself')
          .select('*')
          .eq('group_id', groupId)
          .eq('axis_id', processedAxis.id) // Filter by specific axis
          .order('created_at', { ascending: false })
        
        if (selfError) {
          console.error('Error fetching self placements:', selfError)
        }
        
        // STEP 3: Fetch guessed placements for this specific axis
        const { data: guessedPlacements, error: guessedError } = await supabase
          .from('place_others')
          .select('*')
          .eq('group_id', groupId)
          .eq('axis_id', processedAxis.id) // Filter by specific axis
          .order('created_at', { ascending: false })
        
        if (guessedError) {
          console.error('Error fetching guessed placements:', guessedError)
        }

        // Filter out self-placements and keep only most recent placement for each placer/placed pair
        const filteredGuessedPlacements = ((guessedPlacements || []) as Placement[])
          .filter(placement => placement.placer_user_id !== placement.placed_user_id) // Remove self-placements
          .reduce((acc, placement) => {
            // Create a unique key for each placer/placed pair
            const key = `${placement.placer_user_id}-${placement.placed_user_id}`
            
            // If we haven't seen this pair before, or this placement is more recent than what we have
            if (!acc[key] || new Date(placement.created_at) > new Date(acc[key].created_at)) {
              acc[key] = placement
            }
            return acc
          }, {} as Record<string, Placement>)
        
        // Convert the reduced object back to an array
        const uniqueGuessedPlacements = Object.values(filteredGuessedPlacements)
        
        // STEP 4: Get group members for avatars and names
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
          
        if (membersError) {
          console.error("Error fetching group members:", membersError)
        }
        
        // STEP 5: Get profiles for all members
        const memberUserIds = membersData?.map(member => member.user_id) || []
        
        let profiles: Profile[] = []
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
        
        // STEP 6: Process self placements - get most recent for each user
        const selfPlacedMap = new Map()
        selfPlacements?.forEach(placement => {
          if (!selfPlacedMap.has(placement.user_id)) {
            const profile = profiles.find(p => p.id === placement.user_id)
            selfPlacedMap.set(placement.user_id, {
              user_id: placement.user_id,
              username: placement.first_name || profile?.name || 'Unknown',
              avatar_url: getUserAvatar(placement.user_id, profile?.avatar_url),
              color: getMemberColor(selfPlacedMap.size),
              x: placement.position_x,
              y: placement.position_y
            })
          }
        })
        
        // STEP 7: Process guessed placements
        const guessedResult: GuessedResult[] = []
        
        if (uniqueGuessedPlacements.length > 0) {
          // Group placements by placed_user_id
          const placementsByUser = new Map<string, any[]>()
          
          uniqueGuessedPlacements.forEach(placement => {
            if (!placementsByUser.has(placement.placed_user_id)) {
              placementsByUser.set(placement.placed_user_id, [])
            }
            placementsByUser.get(placement.placed_user_id)?.push(placement)
          })
          
          // Process each user's placements
          placementsByUser.forEach((placements, placedUserId) => {
            const individualGuesses: IndividualGuess[] = []
            let totalX = 0
            let totalY = 0
            
            placements.forEach(placement => {
              const guesserProfile = profiles.find(p => p.id === placement.placer_user_id)
              
              individualGuesses.push({
                guesser_id: placement.placer_user_id,
                guesser_name: guesserProfile?.name || 'Unknown',
                guesser_avatar: getUserAvatar(placement.placer_user_id, guesserProfile?.avatar_url),
                position: { x: placement.position_x, y: placement.position_y }
              })
              
              totalX += placement.position_x
              totalY += placement.position_y
            })
            
            // Calculate average position
            const averageX = totalX / placements.length
            const averageY = totalY / placements.length
            
            // Get placed user's profile
            const placedUserProfile = profiles.find(p => p.id === placedUserId)
            
            guessedResult.push({
              user_id: placedUserId,
              username: placedUserProfile?.name || 'Unknown',
              avatar_url: placedUserProfile?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50)}`,
              color: getMemberColor(guessedResult.length),
              averagePosition: { x: averageX, y: averageY },
              individualGuesses
            })
          })
        }
        
        setResults({
          selfPlaced: Array.from(selfPlacedMap.values()),
          guessed: guessedResult
        })

        console.log('📊 Results loaded:')
        console.log('   - Self placements:', Array.from(selfPlacedMap.values()).length)
        console.log('   - Guessed placements:', guessedResult.length)
        
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
    dailyAxis, // Now returns the actual daily axis data
    results
  }
}