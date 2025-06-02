'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'
import { useComments } from '../hooks/useComments'
import Axis from '../components/Axis'
import { FaCrown } from "react-icons/fa";
import { ChevronDownIcon } from '@heroicons/react/24/solid'

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

interface AxisResults {
  axis_id: string
  date_generated: string
  is_active: boolean
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
  created_by?: string // To know the creator of the group
}

// Colors for consistent member assignment
const getMemberColor = (index: number): string => {
  const colors = [
    '#A855F7', // Purple
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#F97316', // Orange
  ]
  
  return colors[index % colors.length]
}

export default function Home() {
  const router = useRouter()
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [historicalAxes, setHistoricalAxes] = useState<AxisResults[]>([])
  const [loading, setLoading] = useState(true)
  const [axesLoading, setAxesLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [plusDropdownOpen, setPlusDropdownOpen] = useState(false)
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [activeGroupCreator, setActiveGroupCreator] = useState<string | null>(null) // Creator ID
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  // NEW: Comments functionality state
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [selectedAxis, setSelectedAxis] = useState<AxisResults | null>(null)
  const [newComment, setNewComment] = useState('')
  const commentsEndRef = useRef<HTMLDivElement | null>(null)

  // NEW: Comments hook for the selected token and axis
  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    addComment,
    deleteComment
  } = useComments(
    activeGroup, 
    selectedToken, 
    'self', // Always 'self' view for home page historical data
    selectedAxis?.axis_id || null
  )

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  const handleAddComment = async () => {
    if (!selectedToken || !newComment.trim()) return
    try {
      await addComment(newComment.trim())
      setNewComment('')
    } catch (err: any) {
      console.error('Failed to add comment:', err)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddComment()
    }
  }

  // NEW: Handle token click to show comments
  const handleTokenClick = (e: React.MouseEvent, member: GroupMember, axis: AxisResults) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (selectedToken === member.id && selectedAxis?.axis_id === axis.axis_id) {
      // Close if clicking the same token
      setSelectedToken(null)
      setSelectedAxis(null)
    } else {
      // Open comments for this token/axis combination
      setSelectedToken(member.id)
      setSelectedAxis(axis)
    }
  }

  const getSelectedTokenInfo = () => {
    if (!selectedToken || !selectedAxis) return null
    return selectedAxis.members.find(m => m.id === selectedToken)
  }

  const selectedTokenInfo = getSelectedTokenInfo()
  
  // Fetch user and their groups on mount
  useEffect(() => {
    const fetchUserAndGroups = async () => {
      setLoading(true);

      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Error fetching user:", userError);
          router.push('/login');
          return;
        }

        setCurrentUser(user);

        // Get groups where the user is a member
        const { data: groupMemberships, error: groupsError } = await supabase
          .from('group_members')
          .select('group_id, role')
          .eq('user_id', user.id);

        if (groupsError) {
          console.error("Error fetching group memberships:", groupsError);
          return;
        }

        const groupIds = groupMemberships.map(m => m.group_id);

        if (groupIds.length === 0) {
          setUserGroups([]);
          setLoading(false);
          return;
        }

        // Fetch groups with created_by field
        const { data: groupsData, error: groupDetailsError } = await supabase
          .from('groups')
          .select('id, name, invite_code, created_by')
          .in('id', groupIds);

        if (groupDetailsError) {
          console.error("Error fetching group details:", groupDetailsError);
          return;
        }

        // Combine groups with membership roles
        const formattedGroups = groupsData.map(group => {
          const membership = groupMemberships.find(m => m.group_id === group.id);
          return {
            id: group.id,
            name: group.name,
            invite_code: group.invite_code,
            role: membership?.role || 'member',
            created_by: group.created_by
          };
        });

        setUserGroups(formattedGroups);

        if (formattedGroups.length > 0) {
          const firstGroup = formattedGroups[0];
          setActiveGroup(firstGroup.id);
          setGroupName(firstGroup.name);
          setActiveGroupCreator(firstGroup.created_by || null);
          await fetchHistoricalAxes(firstGroup.id);
        }

      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndGroups();
  }, [router]);

  // Fetch historical axes and their results for the given group
  const fetchHistoricalAxes = async (groupId: string) => {
    try {
      setAxesLoading(true);
      console.log('🔍 Fetching historical axes for group:', groupId);

      // 1️⃣ Get all axes for this group (most recent first, limit to 10)
      // Remove the is_active filter to get ALL axes for this group
      const { data: axes, error: axesError } = await supabase
        .from('axes')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (axesError) {
        console.error("Error fetching axes:", axesError);
        setHistoricalAxes([]);
        return;
      }

      if (!axes || axes.length === 0) {
        console.log('No axes found for this group');
        setHistoricalAxes([]);
        return;
      }

      console.log('📊 Found', axes.length, 'axes for group:');
      axes.forEach((axis, index) => {
        console.log(`  ${index + 1}. ID: ${axis.id}, Date: ${axis.date_generated}, Active: ${axis.is_active}`);
      });

      // 2️⃣ Get group members for color assignment and profiles
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);
      
      if (membersError) {
        console.error("Error fetching group members:", membersError);
        return;
      }
      
      const memberUserIds = membersData?.map(member => member.user_id) || [];
      console.log('👥 Group has', memberUserIds.length, 'members');
      
      // 3️⃣ Get profiles for all members
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', memberUserIds);
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      // 4️⃣ Create member color mapping
      const memberColorMap = new Map();
      memberUserIds.forEach((userId, index) => {
        memberColorMap.set(userId, getMemberColor(index));
      });

      // 5️⃣ Process each axis and get its placements
      const axisResults: AxisResults[] = [];
      
      for (const axis of axes) {
        console.log('📋 Processing axis:', axis.id, 'for date:', axis.date_generated);

        // Get self-placements for this specific axis (most recent per user)
        const { data: selfPlacements, error: selfError } = await supabase
          .from('place_yourself')
          .select('*')
          .eq('group_id', groupId)
          .eq('axis_id', axis.id)
          .order('created_at', { ascending: false }); // Get most recent first

        if (selfError) {
          console.error("Error fetching self placements for axis", axis.id, ":", selfError);
          continue; // Skip this axis but continue with others
        }

        console.log(`  └─ Found ${selfPlacements?.length || 0} self-placements for axis ${axis.id}`);

        // Process self-placements into display format
        const members: GroupMember[] = [];
        const processedUserIds = new Set<string>(); // Track processed users to avoid duplicates
        
        if (selfPlacements) {
          selfPlacements.forEach(placement => {
            // Skip if we've already processed this user for this axis
            if (processedUserIds.has(placement.user_id)) {
              console.log(`  ⚠️ Skipping duplicate placement for user ${placement.user_id} in axis ${axis.id}`);
              return;
            }
            
            const profile = profiles?.find(p => p.id === placement.user_id);
            const color = memberColorMap.get(placement.user_id) || getMemberColor(0);
            
            members.push({
              id: placement.user_id,
              name: profile?.name || placement.first_name || 'Unknown',
              imageUrl: profile?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50)}`,
              position: {
                x: (placement.position_x - 50) / 50, // Convert 0-100% to -1 to 1
                y: (placement.position_y - 50) / 50
              },
              color: color,
              borderColor: color
            });
            
            processedUserIds.add(placement.user_id);
          });
        }

        // Create the axis result (include even if no placements for debugging)
        const axisResult: AxisResults = {
          axis_id: axis.id,
          date_generated: axis.date_generated,
          is_active: axis.is_active,
          members: members,
          labels: {
            top: axis.top_label,
            bottom: axis.bottom_label,
            left: axis.left_label,
            right: axis.right_label,
            labelColors: {
              top: 'rgba(251, 207, 232, 0.95)', // Pink
              bottom: 'rgba(167, 243, 208, 0.95)', // Green  
              left: 'rgba(221, 214, 254, 0.95)', // Purple
              right: 'rgba(253, 230, 138, 0.95)' // Yellow
            }
          }
        };

        axisResults.push(axisResult);
        console.log('✅ Added axis', axis.id, 'with', members.length, 'members to results');
      }

      console.log('📊 Final historical axes to display:', axisResults.length);
      axisResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.date_generated} (${result.is_active ? 'Active' : 'Inactive'}) - ${result.members.length} members`);
      });
      
      setHistoricalAxes(axisResults);
      
    } catch (error) {
      console.error("Error fetching historical axes:", error);
      setHistoricalAxes([]);
    } finally {
      setAxesLoading(false);
    }
  };

  // Switch to a different group
  const switchGroup = async (groupId: string) => {
    setAxesLoading(true);
    // Close any open comments when switching groups
    setSelectedToken(null);
    setSelectedAxis(null);
    
    const group = userGroups.find(g => g.id === groupId);
    if (group) {
      setActiveGroup(groupId);
      setGroupName(group.name);
      setActiveGroupCreator(group.created_by || null);
      await fetchHistoricalAxes(groupId);
    }
    setAxesLoading(false);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFF8E1] p-4">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  const leaveGroup = async () => {
    if (!currentUser || !activeGroup) return;
  
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('group_id', activeGroup);
  
    if (error) {
      console.error('Error leaving group:', error);
      return;
    }
  
    setShowLeaveConfirm(false);
  
    // Remove the group from user's groups
    setUserGroups((prevGroups) => {
      const updatedGroups = prevGroups.filter((group) => group.id !== activeGroup);
  
      if (updatedGroups.length > 0) {
        // Switch to the first remaining group
        const newGroup = updatedGroups[0];
        setActiveGroup(newGroup.id);
        setGroupName(newGroup.name);
        setActiveGroupCreator(newGroup.created_by || null);
        fetchHistoricalAxes(newGroup.id);
      } else {
        // No groups left - clear active group & name
        setActiveGroup(null);
        setGroupName('');
        setHistoricalAxes([]);
      }
  
      return updatedGroups;
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-0 bg-[#FFF8E1] relative">
      {/* Header */}
      <header className="sticky top-0 w-full z-20 bg-[#FFF8E1] flex items-center h-20 border-b-2 border-black">
        <button
          className="ml-6 w-12 h-12 rounded-2xl shadow-lg border-2 border-black flex flex-col justify-center items-center"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <span className="block w-7 h-1 bg-black rounded mb-1"></span>
          <span className="block w-7 h-1 bg-black rounded mb-1"></span>
          <span className="block w-7 h-1 bg-black rounded"></span>
        </button>
  
        <div className="flex-1 flex justify-center items-center gap-4">
          <span
            className="text-3xl font-black text-black select-none"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif', letterSpacing: '-1px' }}
          >
            {groupName || 'Select a Group'}
          </span>
        </div>
  
        <div className="relative mr-6">
          <button
            onClick={() => setPlusDropdownOpen(!plusDropdownOpen)}
            className="w-12 h-10 flex items-center justify-center bg-white border border-black rounded-lg shadow-md"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            <div className="flex flex-row justify-center items-center gap-1">
              <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
            </div>
          </button>

          {plusDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white border border-black rounded-xl shadow-lg z-50 flex flex-col"
              style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
            >
              <button
                className="px-6 py-3 text-base text-left w-full hover:bg-gray-100 rounded-t-xl"
                onClick={() => {
                  setPlusDropdownOpen(false);
                  router.push(`/groups/suggest_axis?groupId=${activeGroup}`);
                }}
              >
                Send Axis
              </button>
              <div
                className="border-t"
                style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1 }}
              />
              <button
                className="px-6 py-3 text-base text-left w-full hover:bg-gray-100"
                onClick={() => {
                  setPlusDropdownOpen(false);
                  router.push(`/groups/group_code?groupId=${activeGroup}`);
                }}
              >
                Invite
              </button>
              <div
                className="border-t"
                style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1 }}
              />
              <button
                className="px-6 py-3 text-base w-full flex items-center justify-between hover:bg-gray-100"
                onClick={() => {
                  setPlusDropdownOpen(false);
                  router.push(`/group_members?groupId=${activeGroup}`);
                }}
              >
                <span className="truncate text-left flex-grow">Members</span>
                {currentUser?.id === activeGroupCreator && (
                  <FaCrown
                    className="text-yellow-500 text-s ml-2 flex-shrink-0"
                    title="Moderator"
                    style={{ minWidth: 14, minHeight: 14 }}
                  />
                )}
              </button>

              <div
                className="border-t"
                style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1 }}
              />

              {userGroups.length > 0 && currentUser?.id !== activeGroupCreator && (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="px-6 py-3 text-base text-left text-red-600 hover:bg-gray-100 rounded-b-xl w-full"
                >
                  Leave Group
                </button>
              )}

              {currentUser?.id === activeGroupCreator && (
                <button
                  className="px-6 py-3 text-base w-full flex items-center justify-between hover:bg-gray-100 rounded-b-xl"
                  onClick={() => {
                    setPlusDropdownOpen(false);
                    router.push(`/mod/all_axes?groupId=${activeGroup}`);
                  }}
                >
                  <span className="truncate text-left flex-grow">Manage Axes</span>
                  <FaCrown
                    className="text-yellow-500 text-s ml-2 flex-shrink-0"
                    title="Moderator"
                    style={{ minWidth: 14, minHeight: 14 }}
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </header>
  
      {/* Sidebar Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.10)' }}
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
  
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[70vw] max-w-[400px] bg-[#FFF8E1] shadow-2xl transition-transform duration-300 ease-in-out border-r-2 border-black flex flex-col rounded-br-[100px] ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
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
              <div key={group.id} className="mb-3">
                <div className="flex items-center justify-between ml-2 mr-2">
                  <div
                    className={`text-2xl font-black cursor-pointer hover:text-gray-700 ${
                      activeGroup === group.id ? 'text-blue-600' : ''
                    }`}
                    onClick={() => {
                      switchGroup(group.id);
                      setMenuOpen(false);
                    }}
                  >
                    {group.name}
                  </div>
                </div>
                {index < userGroups.length - 1 && (
                  <div
                    className="ml-2 border-t"
                    style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }}
                  />
                )}
              </div>
            ))}

            {userGroups.length === 0 && (
              <div className="ml-2 text-xl text-gray-600 mb-4">No groups yet</div>
            )}
  
            <div
              className="border-t"
              style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }}
            />
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
          <div
            className="border-t"
            style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }}
          />
          <div
            className="text-4xl font-black mb-6 cursor-pointer hover:text-gray-700"
            onClick={() => {
              setMenuOpen(false);
              router.push('/groups/profile');
            }}
          >
            View Profile
          </div>
          <div
            className="border-t"
            style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }}
          />
          <div
            className="text-4xl font-black flex items-center gap-2 cursor-pointer hover:text-gray-700"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
          >
            Log Out
            <span className="inline-block border-2 border-black rounded-md p-1 ml-2">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
                <path d="M15 12H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
  
      {/* Main Content */}
      <div
        className={`flex flex-col items-center w-full transition-all duration-300 px-6 sm:px-6 md:px-8 ${
          menuOpen ? 'pointer-events-none select-none' : ''
        }`}
      >
        {userGroups.length === 0 ? (
          // No groups state
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="text-2xl font-bold mb-4">You're not in any groups yet!</div>
            <div className="text-lg mb-6">Create a new group or join an existing one.</div>
            <div className="flex gap-4">
              <button
                className="px-6 py-3 bg-black text-white rounded-xl font-bold"
                onClick={() => router.push('/groups/create_group')}
              >
                Create Group
              </button>
              <button
                className="px-6 py-3 border-2 border-black rounded-xl font-bold"
                onClick={() => router.push('/groups/join_group')}
              >
                Join Group
              </button>
            </div>
          </div>
        ) : axesLoading ? (
          // Loading historical axes
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="text-2xl font-bold mb-4">Loading {groupName}...</div>
            <div className="text-lg">Fetching axes and results...</div>
          </div>
        ) : historicalAxes.length === 0 ? (
          // No axes found
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="text-2xl font-bold mb-4">No activity yet!</div>
            <div className="text-lg mb-6">Start by placing yourself to see results for {groupName}.</div>
            <button
              className="px-6 py-3 bg-black text-white rounded-xl font-bold"
              onClick={() => router.push('/groups/place_yourself')}
            >
              Place Yourself
            </button>
          </div>
        ) : (
          // Show historical axes in scrolling format
          <div className="w-full max-w-[430px] space-y-8 pb-8">
            {historicalAxes.map((axis, index) => (
              <div key={axis.axis_id} className="flex flex-col items-center">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {formatDate(axis.date_generated)}
                  </h2>
                  {axis.is_active && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  {axis.members.length} member{axis.members.length !== 1 ? 's' : ''} placed
                </div>
                <div
                  className="w-full max-w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] md:max-w-[430px] relative"
                >
                  <Axis
                    labels={axis.labels}
                    labelColors={axis.labels.labelColors}
                    size={500}
                    tokenSize={36}
                    tokens={axis.members
                      .filter((member, memberIndex, self) => 
                        // Additional safety check: ensure unique IDs even if duplicates slipped through
                        memberIndex === self.findIndex(m => m.id === member.id)
                      )
                      .map((member) => ({
                        id: member.id,
                        name: member.name,
                        x: member.position?.x || 0,
                        y: member.position?.y || 0,
                        color: member.color,
                        borderColor: member.borderColor,
                        imageUrl: member.imageUrl,
                        onClick: (e: React.MouseEvent) => handleTokenClick(e, member, axis), // NEW: Add click handler
                        isSelected: selectedToken === member.id && selectedAxis?.axis_id === axis.axis_id, // NEW: Show selection
                      }))
                    }
                  />
                </div>
                {/* Add separator line between axes except for the last one */}
                {index < historicalAxes.length - 1 && (
                  <div className="w-full border-t border-gray-300 mt-8"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW: Comments Panel - Same design as results page */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#FFF5D6] rounded-t-[36px] shadow-2xl transition-transform duration-300 ease-in-out transform ${
          selectedToken ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '70vh',
          minHeight: '320px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)'
        }}
      >
        {selectedToken && selectedTokenInfo && selectedAxis && (
          <>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <button
                onClick={() => {
                  setSelectedToken(null);
                  setSelectedAxis(null);
                }}
                aria-label="Close comments"
                className="p-1 mr-1"
              >
                <ChevronDownIcon className="h-7 w-7 text-black" />
              </button>
              <div className="flex-1 flex justify-center items-center">
                <span className="text-3xl font-black" style={{ fontFamily: 'Arial Black' }}>
                  comments
                </span>
              </div>
              <div className="ml-2 flex items-center justify-center">
                <img
                  src={selectedTokenInfo.imageUrl || selectedTokenInfo.avatar_url}
                  alt="avatar"
                  className="w-12 h-12 rounded-full border-4"
                  style={{ borderColor: selectedTokenInfo.color || '#A855F7' }}
                />
              </div>
            </div>

            {/* Show axis context for comments */}
            <div className="px-6 pb-2">
              <div className="text-xs text-gray-600 text-center">
                Comments for {selectedTokenInfo.name} on {formatDate(selectedAxis.date_generated)}
              </div>
            </div>

            <div className="px-6 pb-4 pt-2">
              <div className="rounded-3xl bg-[#FFFAED] p-4 min-h-[120px] max-h-[200px] overflow-y-auto text-lg font-semibold">
                {commentsLoading ? (
                  <div className="text-gray-500 text-center py-4">Loading comments...</div>
                ) : commentsError ? (
                  <div className="text-red-500 text-center py-4">Error: {commentsError}</div>
                ) : comments.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    No comments yet for this placement.
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="mb-3 last:mb-0">
                      <span className="font-bold">{comment.author}:</span> {comment.text}
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-2">
              <input
                type="text"
                placeholder="Comment on this placement…"
                className="flex-1 rounded-full bg-[#F3F1E6] border-none px-5 py-3 text-lg placeholder:text-[#C2B68A] focus:outline-none focus:ring-2 focus:ring-[#EADFA7]"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={!selectedToken || commentsLoading || !selectedAxis}
              />
              <button
                onClick={handleAddComment}
                className="bg-[#60A5FA] rounded-full px-6 py-3 font-bold text-white border-2 border-[#3B82F6] hover:bg-[#3B82F6] transition disabled:opacity-50"
                disabled={!newComment.trim() || commentsLoading || !selectedAxis}
              >
                {commentsLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Leave Group Confirmation */}
      {showLeaveConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-lg w-80 text-center"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            <h2 className="text-xl font-bold mb-4">Leave Group?</h2>
            <p className="mb-6">Are you sure you want to leave {groupName}?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={async () => {
                  await leaveGroup();
                  router.push('/home');
                }}
                className="px-4 py-2 rounded-lg bg-red-600 border border-black text-white font-bold hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded-lg border border-black hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}