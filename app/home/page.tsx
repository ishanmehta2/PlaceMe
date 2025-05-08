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

export default function Home() {
  const router = useRouter()
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [dailyPlacements, setDailyPlacements] = useState<DailyPlacement[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [plusDropdownOpen, setPlusDropdownOpen] = useState(false)
  
  // Mock data for the frontend demo
  useEffect(() => {
    // Create dates from May 4th to May 8th
    const dates = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(2024, 4, 4 + i)
      return date
    }).reverse() // Reverse to get most recent first
    
    // Different positions for each day
    const dailyPositions = [
      // May 8th positions
      [
        { x: -0.6, y: -0.4 },
        { x: 0.6, y: -0.6 },
        { x: -0.6, y: 0.6 },
        { x: 0.4, y: 0.4 },
        { x: 0, y: 0 }
      ],
      // May 7th positions
      [
        { x: -0.4, y: -0.2 },
        { x: -0.9, y: -0.4 },
        { x: -0.2, y: 0.4 },
        { x: 0.2, y: 0.2 },
        { x: 0, y: 0 }
      ],
      // May 6th positions
      [
        { x: -0.2, y: 0 },
        { x: 0.2, y: -0.2 },
        { x: 0, y: 0.2 },
        { x: 0, y: 0 },
        { x: -0.4, y: -0.4 }
      ],
      // May 5th positions
      [
        { x: 0, y: 0.2 },
        { x: 0, y: -0.2 },
        { x: 0.2, y: 0 },
        { x: -0.2, y: 0 },
        { x: 0.4, y: -0.4 }
      ],
      // May 4th positions
      [
        { x: 0.2, y: 0 },
        { x: -0.2, y: 0 },
        { x: 0, y: 0.2 },
        { x: 0, y: -0.2 },
        { x: 0.4, y: -0.4 }
      ]
    ]
    
    // Different axis labels for each day
    const dailyLabels = [
      // May 8th labels (same as results page)
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
      // May 7th labels
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
      // May 6th labels
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
      // May 5th labels
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
      // May 4th labels
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

    // Define member data with consistent colors and images
    const members = [
      {
        id: '1',
        name: 'Samantha',
        color: '#A855F7', // Purple
        borderColor: '#A855F7',
        imageUrl: 'https://i.pravatar.cc/150?img=1'
      },
      {
        id: '2',
        name: 'Nils',
        color: '#EF4444', // Red
        borderColor: '#EF4444',
        imageUrl: 'https://i.pravatar.cc/150?img=2'
      },
      {
        id: '3',
        name: 'Ishan',
        color: '#3B82F6', // Blue
        borderColor: '#3B82F6',
        imageUrl: 'https://i.pravatar.cc/150?img=3'
      },
      {
        id: '4',
        name: 'Janina',
        color: '#10B981', // Green
        borderColor: '#10B981',
        imageUrl: 'https://i.pravatar.cc/150?img=4'
      },
      {
        id: '5',
        name: 'Melody',
        color: '#F59E42', // Orange
        borderColor: '#F59E42',
        imageUrl: 'https://i.pravatar.cc/150?img=5'
      }
    ]
    
    // Mock group members with positions
    const mockPlacements = dates.map((date, index) => ({
      date: formatDate(date),
      members: members.map((member, memberIndex) => ({
        ...member,
        position: dailyPositions[index][memberIndex]
      })),
      labels: dailyLabels[index]
    }))
    
    setDailyPlacements(mockPlacements)
    setGroupName('Fun Group')
    setLoading(false)
  }, [])
  
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
            {groupName || '278 Squad'}
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
              <button className="px-6 py-3 text-lg text-left hover:bg-gray-100 rounded-b-xl">Invite</button>
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
            <div className="ml-2 text-2xl font-black mb-1">Robber Barons</div>
            <div className="ml-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }} />
            <div className="ml-2 text-2xl font-black mb-4">Simps</div>
            <div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }} />
            <div className="ml-2 text-2xl font-black mb-1">+ Create Group</div>
            <div className="ml-2 text-2xl font-black mb-6">+ Join Group</div>
          </div>
          <div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }} />
          <div className="text-4xl font-black mb-6">View Profile</div>
          <div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, margin: '8px 0' }} />
          <div className="text-4xl font-black flex items-center gap-2">
            Log Out
            <span className="inline-block border-2 border-black rounded-md p-1 ml-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/><path d="M15 12H3"/></svg>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex flex-col items-center w-full transition-all duration-300 px-6 sm:px-6 md:px-8 ${menuOpen ? 'pointer-events-none select-none' : ''}`}>
        {dailyPlacements.map((placement) => (
          <div key={placement.date} className="w-full max-w-[430px] mb-8 flex flex-col items-center">
            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
              {placement.date}
            </h2>
            <div onClick={() => router.push('/groups/results')} className="cursor-pointer w-full max-w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] md:max-w-[430px]">
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
        ))}
      </div>
    </main>
  )
}