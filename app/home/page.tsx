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
  
  // Mock data for the frontend demo
  useEffect(() => {
    // Create dates from May 4th to May 7th
    const dates = Array.from({ length: 4 }, (_, i) => {
      const date = new Date(2024, 4, 4 + i)
      return date
    }).reverse() // Reverse to get most recent first
    
    // Different positions for each day
    const dailyPositions = [
      // May 7th positions
      [
        { x: -0.6, y: -0.4 },
        { x: 0.6, y: -0.6 },
        { x: -0.6, y: 0.6 },
        { x: 0.4, y: 0.4 },
        { x: 0, y: 0 }
      ],
      // May 6th positions
      [
        { x: -0.4, y: -0.2 },
        { x: -0.9, y: -0.4 },
        { x: -0.2, y: 0.4 },
        { x: 0.2, y: 0.2 },
        { x: 0, y: 0 }
      ],
      // May 5th positions
      [
        { x: -0.2, y: 0 },
        { x: 0.2, y: -0.2 },
        { x: 0, y: 0.2 },
        { x: 0, y: 0 },
        { x: -0.4, y: -0.4 }
      ],
      // May 4th positions
      [
        { x: 0, y: 0.2 },
        { x: 0, y: -0.2 },
        { x: 0.2, y: 0 },
        { x: -0.2, y: 0 },
        { x: 0.4, y: -0.4 }
      ]
    ]
    
    // Different axis labels for each day
    const dailyLabels = [
      // May 7th labels
      {
        top: 'Adventurous',
        bottom: 'Cautious',
        left: 'Follower',
        right: 'Leader',
        labelColors: {
          top: 'rgba(251, 207, 232, 0.95)', // Pink
          bottom: 'rgba(167, 243, 208, 0.95)', // Green
          left: 'rgba(221, 214, 254, 0.95)', // Purple
          right: 'rgba(253, 230, 138, 0.95)' // Yellow
        }
      },
      // May 6th labels
      {
        top: 'Creative',
        bottom: 'Practical',
        left: 'Analytical',
        right: 'Intuitive',
        labelColors: {
          top: 'rgba(167, 243, 208, 0.95)', // Green
          bottom: 'rgba(251, 207, 232, 0.95)', // Pink
          left: 'rgba(253, 230, 138, 0.95)', // Yellow
          right: 'rgba(221, 214, 254, 0.95)' // Purple
        }
      },
      // May 5th labels
      {
        top: 'Extrovert',
        bottom: 'Introvert',
        left: 'Planner',
        right: 'Spontaneous',
        labelColors: {
          top: 'rgba(253, 230, 138, 0.95)', // Yellow
          bottom: 'rgba(221, 214, 254, 0.95)', // Purple
          left: 'rgba(251, 207, 232, 0.95)', // Pink
          right: 'rgba(167, 243, 208, 0.95)' // Green
        }
      },
      // May 4th labels
      {
        top: 'Kinky',
        bottom: 'Vanilla',
        left: 'Sub',
        right: 'Dom',
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
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#FFF8E1]">
      {dailyPlacements.map((placement) => (
        <div key={placement.date} className="w-full max-w-[430px] mb-8">
          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
            {placement.date}
          </h2>
          
          <Axis
            labels={{
              top: placement.labels.top,
              bottom: placement.labels.bottom,
              left: placement.labels.left,
              right: placement.labels.right
            }}
            labelColors={placement.labels.labelColors}
            size={300}
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
      ))}
      
      {/* Add your placement button */}
      <div className="fixed bottom-6 right-6">
        <button 
          className="bg-[#60A5FA] w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
          onClick={() => router.push('/add-placement')}
        >
          <span className="text-4xl font-black text-white" style={{ 
            textShadow: '1px 1px 0 #000',
            fontFamily: 'Arial, sans-serif'
          }}>
            +
          </span>
        </button>
      </div>
    </main>
  )
}