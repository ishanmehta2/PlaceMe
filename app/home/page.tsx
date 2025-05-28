'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'
import Axis from '../components/Axis'
import { FaCrown } from "react-icons/fa";

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
  axis_id: string
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
  const [dailyPlacements, setDailyPlacements] = useState<DailyPlacement[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [plusDropdownOpen, setPlusDropdownOpen] = useState(false)
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [activeGroupCreator, setActiveGroupCreator] = useState<string | null>(null) // Creator ID
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  
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
          await fetchDailyPlacements(firstGroup.id);
        }

      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndGroups();
  }, [router]);

  // Simplified approach - get sessions directly from placement tables
  const fetchDailyPlacements = async (groupId: string) => {
    try {
      console.log('🔍 Fetching placement sessions for group:', groupId);

      // 1️⃣ Get all self-placements for this group
      const { data: selfPlacements, error: selfError } = await supabase
        .from('place_yourself')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (selfError) {
        console.error("Error fetching self placements:", selfError);
        return;
      }

      if (!selfPlacements || selfPlacements.length === 0) {
        console.log('No self-placements found for this group');
        setDailyPlacements([]);
        return;
      }

      console.log('👤 Found', selfPlacements.length, 'self-placements');

      // 2️⃣ Get all others-placements for this group  
      const { data: othersPlacements, error: othersError } = await supabase
        .from('place_others')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (othersError) {
        console.error("Error fetching others placements:", othersError);
      }

      console.log('👥 Found', othersPlacements?.length || 0, 'others-placements');

      // 3️⃣ Get group members for color assignment
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);
      
      if (membersError) {
        console.error("Error fetching group members:", membersError);
        return;
      }
      
      const memberUserIds = membersData?.map(member => member.user_id) || [];
      
      // 4️⃣ Get profiles for all members
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', memberUserIds);
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      // 5️⃣ Create member color mapping
      const memberColorMap = new Map();
      memberUserIds.forEach((userId, index) => {
        memberColorMap.set(userId, getMemberColor(index));
      });

      // 6️⃣ Group placements by axis_id to create sessions
      const sessionMap = new Map();

      // Process self-placements first
      selfPlacements.forEach(placement => {
        const axisId = placement.axis_id || 'unknown';
        
        if (!sessionMap.has(axisId)) {
          sessionMap.set(axisId, {
            axis_id: axisId,
            created_at: placement.created_at,
            labels: {
              top: placement.top_label,
              bottom: placement.bottom_label,
              left: placement.left_label,
              right: placement.right_label,
              labelColors: {
                top: 'rgba(251, 207, 232, 0.95)', // Pink
                bottom: 'rgba(167, 243, 208, 0.95)', // Green  
                left: 'rgba(221, 214, 254, 0.95)', // Purple
                right: 'rgba(253, 230, 138, 0.95)' // Yellow
              }
            },
            members: [],
            processedUsers: new Set()
          });
        }

        const session = sessionMap.get(axisId);
        
        // Add self-placement if not already processed
        if (!session.processedUsers.has(placement.user_id)) {
          const profile = profiles?.find(p => p.id === placement.user_id);
          const color = memberColorMap.get(placement.user_id) || getMemberColor(0);
          
          session.members.push({
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
          
          session.processedUsers.add(placement.user_id);
        }
      });

      // Add others-placements to existing sessions
      if (othersPlacements) {
        othersPlacements.forEach(placement => {
          const axisId = placement.axis_id || 'unknown';
          
          // Only add to sessions that already exist (have self-placements)
          if (sessionMap.has(axisId)) {
            const session = sessionMap.get(axisId);
            
            // Add if not already processed
            if (!session.processedUsers.has(placement.placed_user_id)) {
              const profile = profiles?.find(p => p.id === placement.placed_user_id);
              const color = memberColorMap.get(placement.placed_user_id) || getMemberColor(0);
              
              session.members.push({
                id: placement.placed_user_id,
                name: profile?.name || placement.first_name || 'Unknown',
                imageUrl: profile?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50)}`,
                position: {
                  x: (placement.position_x - 50) / 50,
                  y: (placement.position_y - 50) / 50
                },
                color: color,
                borderColor: color
              });
              
              session.processedUsers.add(placement.placed_user_id);
            }
          }
        });
      }

      // 7️⃣ Convert sessions to display format and sort by most recent
      const sessions = Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10) // Limit to 10 most recent
        .map(session => ({
          date: formatDate(new Date(session.created_at)),
          axis_id: session.axis_id,
          members: session.members,
          labels: session.labels
        }));

      console.log('📋 Final sessions:', sessions.length);
      setDailyPlacements(sessions);
      
    } catch (error) {
      console.error("Error fetching placement sessions:", error);
      setDailyPlacements([]);
    }
  };
  // Switch to a different group
  const switchGroup = async (groupId: string) => {
    setLoading(true);
    const group = userGroups.find(g => g.id === groupId);
    if (group) {
      setActiveGroup(groupId);
      setGroupName(group.name);
      setActiveGroupCreator(group.created_by || null);
      await fetchDailyPlacements(groupId);
    }
    setLoading(false);
  };

  const formatDate = (date: Date): string => {
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
        fetchDailyPlacements(newGroup.id);
      } else {
        // No groups left - clear active group & name
        setActiveGroup(null);
        setGroupName('');
        setDailyPlacements([]);
        // Optionally navigate or show a message
        // router.push('/no-groups'); // Or stay on this page and show a message
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
              className="px-6 py-3 text-base text-left w-full hover:bg-gray-100 rounded-b-xl"
              onClick={() => {
                setPlusDropdownOpen(false);
                router.push('/groups/group_code');
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
                className="px-6 py-3 text-lg text-left hover:bg-gray-100 rounded-t-xl"
                onClick={() => {
                  setPlusDropdownOpen(false);
                  router.push(`/groups/suggest_axis?groupId=${activeGroup}`);
                }}
              >
                Send Axes
              </button>
              <div
                className="border-t"
                style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1 }}
              />
              <button
                className="px-6 py-3 text-lg text-left hover:bg-gray-100 rounded-b-xl"
                onClick={() => {
                  setPlusDropdownOpen(false);
                  router.push(`/groups/group_code?groupId=${activeGroup}`);
                }}
              >
                Leave Group
              </button>
            )}

            {currentUser?.id === activeGroupCreator && (
              <button
                className="px-6 py-3 text-base w-full flex items-center justify-between hover:bg-gray-100"
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
                    className="text-2xl font-black cursor-pointer hover:text-gray-700"
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
        ) : dailyPlacements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="text-2xl font-bold mb-4">No activity yet!</div>
            <div className="text-lg mb-6">Start by placing yourself to see results here.</div>
            <button
              className="px-6 py-3 bg-black text-white rounded-xl font-bold"
              onClick={() => router.push('/groups/place_yourself')}
            >
              Place Yourself
            </button>
          </div>
        ) : (
          dailyPlacements.map((placement) => (
            <div key={`${placement.axis_id}-${placement.date}`} className="w-full max-w-[430px] mb-8 flex flex-col items-center">
              <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                {placement.date}
              </h2>
              <div
                onClick={() => activeGroup && router.push(`/groups/results`)}
                className="cursor-pointer w-full max-w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] md:max-w-[430px]"
              >
                <Axis
                  labels={{
                    top: placement.labels.top,
                    bottom: placement.labels.bottom,
                    left: placement.labels.left,
                    right: placement.labels.right,
                  }}
                  labelColors={placement.labels.labelColors}
                  size={500}
                  tokenSize={36}
                  tokens={placement.members.map((member) => ({
                    id: member.id,
                    name: member.name,
                    x: member.position?.x || 0,
                    y: member.position?.y || 0,
                    color: member.color,
                    borderColor: member.borderColor,
                    imageUrl: member.imageUrl,
                  }))}
                />
              </div>
            </div>
          ))
        )}
      </div>
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