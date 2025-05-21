'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'
import Axis from '../components/Axis'

interface GroupMember {
  id: string
  name: string
  avatar_url?: string
  avatarUrl?: string
  imageUrl?: string
  position?: {
    x: number
    y: number
  }
  color?: string
  borderColor?: string
}

interface DailyPlacement {
  date: string
  members: GroupMember[]
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

interface UserGroup {
  id: string
  name: string
  invite_code: string
  role: string
}

export default function Home() {
  const router = useRouter()
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [dailyPlacements, setDailyPlacements] = useState<DailyPlacement[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [plusDropdownOpen, setPlusDropdownOpen] = useState(false)
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  
  // Different positions for each day (reused from original code)
  const dailyPositions = [
    // Day 1 positions
    [
      { x: -0.6, y: -0.4 },
      { x: 0.6, y: -0.6 },
      { x: -0.6, y: 0.6 },
      { x: 0.4, y: 0.4 },
      { x: 0, y: 0 }
    ],
    // Day 2 positions
    [
      { x: -0.4, y: -0.2 },
      { x: -0.9, y: -0.4 },
      { x: -0.2, y: 0.4 },
      { x: 0.2, y: 0.2 },
      { x: 0, y: 0 }
    ],
    // Day 3 positions
    [
      { x: -0.2, y: 0 },
      { x: 0.2, y: -0.2 },
      { x: 0, y: 0.2 },
      { x: 0, y: 0 },
      { x: -0.4, y: -0.4 }
    ],
    // Day 4 positions
    [
      { x: 0, y: 0.2 },
      { x: 0, y: -0.2 },
      { x: 0.2, y: 0 },
      { x: -0.2, y: 0 },
      { x: 0.4, y: -0.4 }
    ],
    // Day 5 positions
    [
      { x: 0.2, y: 0 },
      { x: -0.2, y: 0 },
      { x: 0, y: 0.2 },
      { x: 0, y: -0.2 },
      { x: 0.4, y: -0.4 }
    ]
  ]
  
  // Different axis labels for each day (reused from original code)
  const dailyLabels = [
    // Day 1 labels
    {
      top: 'Wet Sock',
      bottom: 'Dry Tongue',
      left: 'Tree Hugger',
      right: 'Lumberjack',
      labelColors: {
        top: 'rgba(251, 207, 232, 0.95)', // Pink
        bottom: 'rgba(167, 243, 208, 0.95)', // Green
        left: 'rgba(221, 214, 254, 0.95)', // Purple
        right: 'rgba(253, 230, 138, 0.95)' // Yellow
      }
    },
    // Day 2 labels
    {
      top: 'Early Bird',
      bottom: 'Last Minute',
      left: 'Solo Traveler',
      right: 'Group Explorer',
      labelColors: {
        top: 'rgba(251, 207, 232, 0.95)', // Pink
        bottom: 'rgba(167, 243, 208, 0.95)', // Green
        left: 'rgba(221, 214, 254, 0.95)', // Purple
        right: 'rgba(253, 230, 138, 0.95)' // Yellow
      }
    },
    // Day 3 labels
    {
      top: 'Morning Person',
      bottom: 'Night Owl',
      left: 'Planner',
      right: 'Spontaneous',
      labelColors: {
        top: 'rgba(167, 243, 208, 0.95)', // Green
        bottom: 'rgba(251, 207, 232, 0.95)', // Pink
        left: 'rgba(253, 230, 138, 0.95)', // Yellow
        right: 'rgba(221, 214, 254, 0.95)' // Purple
      }
    },
    // Day 4 labels
    {
      top: 'Cat Person',
      bottom: 'Dog Person',
      left: 'Beach',
      right: 'Mountains',
      labelColors: {
        top: 'rgba(253, 230, 138, 0.95)', // Yellow
        bottom: 'rgba(221, 214, 254, 0.95)', // Purple
        left: 'rgba(251, 207, 232, 0.95)', // Pink
        right: 'rgba(167, 243, 208, 0.95)' // Green
      }
    },
    // Day 5 labels
    {
      top: 'Sweet Tooth',
      bottom: 'Savory Fan',
      left: 'City Life',
      right: 'Country Living',
      labelColors: {
        top: 'rgba(221, 214, 254, 0.95)', // Purple
        bottom: 'rgba(253, 230, 138, 0.95)', // Yellow
        left: 'rgba(167, 243, 208, 0.95)', // Green
        right: 'rgba(251, 207, 232, 0.95)' // Pink
      }
    }
  ]

  // Fetch user and their groups on component mount
  useEffect(() => {
    const fetchUserAndGroups = async () => {
      setLoading(true);
      
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("Error fetching user:", userError);
          router.push('/login'); // Redirect to login if no user
          return;
        }
        
        setCurrentUser(user);
        
        // Fetch groups the user is a member of using a join query
        const { data: groupMemberships, error: groupsError } = await supabase
          .from('group_members')
          .select(`
            id,
            role,
            joined_at,
            group_id
          `)
          .eq('user_id', user.id);
          
        if (groupsError) {
          console.error("Error fetching group memberships:", groupsError);
          return;
        }
        
        // Get the groups details
        const groupIds = groupMemberships.map(membership => membership.group_id);
        
        // If no groups, return early
        if (groupIds.length === 0) {
          setUserGroups([]);
          setLoading(false);
          return;
        }
        
        const { data: groupsData, error: groupDetailsError } = await supabase
          .from('groups')
          .select('id, name, invite_code, settings, created_at')
          .in('id', groupIds);
        
        if (groupDetailsError) {
          console.error("Error fetching group details:", groupDetailsError);
          return;
        }
        
        // Combine the group details with membership info
        const formattedGroups = groupsData.map(group => {
          const membership = groupMemberships.find(m => m.group_id === group.id);
          return {
            id: group.id,
            name: group.name,
            invite_code: group.invite_code,
            role: membership?.role || 'member'
          };
        });
        
        setUserGroups(formattedGroups);
        
        // If there are groups, set the active group to the first one
        if (formattedGroups.length > 0) {
          setActiveGroup(formattedGroups[0].id);
          setGroupName(formattedGroups[0].name);
          
          // Now fetch daily placements for the active group
          await fetchDailyPlacements(formattedGroups[0].id);
        }
        
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndGroups();
  }, [router]);
  
  // Function to fetch daily placements for a group
  const fetchDailyPlacements = async (groupId: string) => {
    try {
      // Fetch group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('id, role, user_id, joined_at')
        .eq('group_id', groupId);
      
      if (membersError) {
        console.error("Error fetching group members:", membersError);
        return;
      }
      
      // Get user profiles for the members
      const memberUserIds = membersData.map(member => member.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', memberUserIds);
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }
      
      // Colors for members
      const memberColors = [
        '#A855F7', // Purple
        '#EF4444', // Red
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E42'  // Orange
      ];
      
      // Transform member data
      const groupMembers = membersData.map((member, index) => {
        const profile = profiles.find(p => p.id === member.user_id);
        return {
          id: member.user_id,
          name: profile?.name || `User ${index + 1}`,
          avatarUrl: profile?.avatar_url,
          imageUrl: profile?.avatar_url || `https://i.pravatar.cc/150?img=${index + 1}`,
          color: memberColors[index % memberColors.length],
          borderColor: memberColors[index % memberColors.length]
        };
      });
      
      // In a real app, you would fetch actual placements data
      // For now, we'll generate mock data similar to what we had before
      
      // Create dates from the last 5 days
      const currentDate = new Date();
      const dates = Array.from({ length: 5 }, (_, i) => {
        const date = new Date();
        date.setDate(currentDate.getDate() - i);
        return date;
      });
      
      // Create mock placements with the actual group members
      const mockPlacements = dates.map((date, index) => ({
        date: formatDate(date),
        members: groupMembers.map((member, memberIndex) => ({
          ...member,
          position: dailyPositions[index % dailyPositions.length][memberIndex % 5] // Reuse positions if needed
        })),
        labels: dailyLabels[index % dailyLabels.length]
      }));
      
      setDailyPlacements(mockPlacements);
      
    } catch (error) {
      console.error("Error fetching daily placements:", error);
    }
  };
  
  // Switch to a different group
  const switchGroup = async (groupId: string) => {
    setLoading(true);
    
    // Find the group in userGroups
    const group = userGroups.find(g => g.id === groupId);
    
    if (group) {
      setActiveGroup(groupId);
      setGroupName(group.name);
      await fetchDailyPlacements(groupId);
    }
    
    setLoading(false);
  };
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  
  const getMemberColor = (memberId: string): string => {
    // Assign a consistent color to each member
    const colors = [
      'bg-purple-500',
      'bg-red-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-yellow-500'
    ]
    
    // Use the member's ID to determine their color
    const colorIndex = parseInt(memberId) % colors.length
    return colors[colorIndex]
  }
  
  const getBorderColor = (memberId: string): string => {
    // Assign a consistent border color to each member
    const colors = [
      'border-purple-700',
      'border-red-700',
      'border-pink-700',
      'border-green-700',
      'border-blue-700',
      'border-yellow-700'
    ]
    
    // Use the member's ID to determine their color
    const colorIndex = parseInt(memberId) % colors.length
    return colors[colorIndex]
  }
  
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center p-0 bg-[#FFF8E1] relative">
      {/* Sticky Header */}
      <header className="sticky top-0 left-0 w-full z-20 bg-[#FFF8E1] flex items-center h-20 border-b-2 border-black">
        <button
          className="ml-6 flex flex-col justify-center items-center w-12 h-12 bg-[#FFF8E1] rounded-2xl shadow-lg border-2 border-black focus:outline-none"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
        >
          <span className="block w-7 h-1 bg-black rounded mb-1"></span>
          <span className="block w-7 h-1 bg-black rounded mb-1"></span>
          <span className="block w-7 h-1 bg-black rounded"></span>
        </button>
        <div className="flex-1 flex justify-center items-center">
          <span className="text-3xl font-black text-black select-none" style={{ fontFamily: 'Arial Black, Arial, sans-serif', letterSpacing: '-1px' }}>
            {groupName || 'Select a Group'}
          </span>
        </div>
        <div className="relative mr-6">
          <button
            className="flex items-center justify-center w-12 h-12 bg-[#FFF8E1] rounded-2xl shadow-lg border-2 border-black focus:outline-none text-4xl font-black text-black"
            onClick={() => setPlusDropdownOpen((open) => !open)}
            aria-label="Open plus menu"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            +
          </button>
          {plusDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-black rounded-xl shadow-lg z-50 flex flex-col" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              <button className="px-6 py-3 text-lg text-left hover:bg-gray-100 rounded-t-xl">Suggest Axis</button>
              <div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1 }} />
              <button 
                className="px-6 py-3 text-lg text-left hover:bg-gray-100 rounded-b-xl"
                onClick={() => {
                  setPlusDropdownOpen(false);
                  router.push('/groups/group_code')
                }}
              >
                Invite
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.10)' }} onClick={() => setMenuOpen(false)}></div>
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[70vw] max-w-[400px] bg-[#FFF8E1] shadow-2xl transition-transform duration-300 ease-in-out border-r-2 border-black flex flex-col rounded-br-[100px] ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
      >
        <button
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-transparent text-3xl"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          ×
        </button>
        <div className="p-8 pt-20 flex flex-col gap-0">
          <div>
            <div className="text-5xl font-black mb-2">Groups</div>
            
            {/* Dynamically render the user's groups */}
            {userGroups.map((group, index) => (
              <div key={group.id}>
                <div 
                  className="ml-2 text-2xl font-black mb-1 cursor-pointer hover:text-gray-700"
                  onClick={() => {
                    switchGroup(group.id);
                    setMenuOpen(false);
                  }}
                >
                  {group.name}
                </div>
                {index < userGroups.length - 1 && (
                  <div className="ml-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }} />
                )}
              </div>
            ))}
            
            {userGroups.length === 0 && (
              <div className="ml-2 text-xl text-gray-600 mb-4">No groups yet</div>
            )}
            
            <div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }} />
            <div 
              className="ml-2 text-2xl font-black mb-1 cursor-pointer hover:text-gray-700"
              onClick={() => {
                setMenuOpen(false);
                router.push('/groups/create_group');
              }}
            >
              + Create Group
            </div>
            <div 
              className="ml-2 text-2xl font-black mb-6 cursor-pointer hover:text-gray-700"
              onClick={() => {
                setMenuOpen(false);
                router.push('/groups/join_group');
              }}
            >
              + Join Group
            </div>
          </div>
          <div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }} />
          <div 
            className="text-4xl font-black mb-6 cursor-pointer hover:text-gray-700"
            onClick={() => {
              setMenuOpen(false);
              router.push('/profile');
            }}
          >
            View Profile
          </div>
          <div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }} />
          <div 
            className="text-4xl font-black flex items-center gap-2 cursor-pointer hover:text-gray-700"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
          >
            Log Out
            <span className="inline-block border-2 border-black rounded-md p-1 ml-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/><path d="M15 12H3"/></svg>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex flex-col items-center w-full transition-all duration-300 px-6 sm:px-6 md:px-8 ${menuOpen ? 'pointer-events-none select-none' : ''}`}>
        {userGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="text-2xl font-bold mb-4">You're not in any groups yet!</div>
            <div className="text-lg mb-6">Create a new group or join an existing one.</div>
            <div className="flex gap-4">
              <button 
                className="px-6 py-3 bg-black text-white rounded-xl font-bold"
                onClick={() => router.push('/groups/create')}
              >
                Create Group
              </button>
              <button 
                className="px-6 py-3 border-2 border-black rounded-xl font-bold"
                onClick={() => router.push('/groups/join')}
              >
                Join Group
              </button>
            </div>
          </div>
        ) : (
          dailyPlacements.map((placement) => (
            <div key={placement.date} className="w-full max-w-[430px] mb-8 flex flex-col items-center">
              <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                {placement.date}
              </h2>
              <div 
                onClick={() => activeGroup && router.push(`/groups/${activeGroup}/results`)} 
                className="cursor-pointer w-full max-w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] md:max-w-[430px]"
              >
                <Axis
                  labels={{
                    top: placement.labels.top,
                    bottom: placement.labels.bottom,
                    left: placement.labels.left,
                    right: placement.labels.right
                  }}
                  labelColors={placement.labels.labelColors}
                  size={500}
                  tokenSize={36}
                  tokens={placement.members.map(member => ({
                    id: member.id,
                    name: member.name,
                    x: member.position?.x || 0.5,
                    y: member.position?.y || 0.5,
                    color: member.color,
                    borderColor: member.borderColor,
                    imageUrl: member.imageUrl
                  }))}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}