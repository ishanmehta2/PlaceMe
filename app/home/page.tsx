'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'

interface GroupMember {
  id: string
  name: string
  avatar_url?: string
  position?: {
    x: number
    y: number
  }
}

interface DailyPlacement {
  date: string
  members: GroupMember[]
}

export default function Home() {
  const router = useRouter()
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [previousDate, setPreviousDate] = useState(new Date())
  const [dailyPlacements, setDailyPlacements] = useState<DailyPlacement[]>([])
  const [loading, setLoading] = useState(true)
  
  // Mock data for the frontend demo
  useEffect(() => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    setCurrentDate(today)
    setPreviousDate(yesterday)
    
    // Mock group members with positions
    const mockPlacements = [
      {
        date: formatDate(today),
        members: [
          { id: '1', name: 'Samantha', avatar_url: '/avatars/samantha.jpg', position: { x: 0.2, y: 0.3 } },
          { id: '2', name: 'Nils', avatar_url: '/avatars/nils.jpg', position: { x: 0.8, y: 0.2 } },
          { id: '3', name: 'Ishan', avatar_url: '/avatars/ishan.jpg', position: { x: 0.2, y: 0.8 } },
          { id: '4', name: 'Janina', avatar_url: '/avatars/janina.jpg', position: { x: 0.7, y: 0.7 } }
        ]
      },
      {
        date: formatDate(yesterday),
        members: [
          { id: '1', name: 'Samantha', avatar_url: '/avatars/samantha.jpg', position: { x: 0.2, y: 0.5 } },
          { id: '2', name: 'Nils', avatar_url: '/avatars/nils.jpg', position: { x: 0.8, y: 0.3 } },
          { id: '3', name: 'Ishan', avatar_url: '/avatars/ishan.jpg', position: { x: 0.2, y: 0.8 } },
          { id: '4', name: 'Janina', avatar_url: '/avatars/janina.jpg', position: { x: 0.6, y: 0.8 } }
        ]
      }
    ]
    
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
      {dailyPlacements.map((placement, index) => (
        <div key={placement.date} className="w-full max-w-md mb-12">
          <h2 className="text-3xl font-black mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
            {index === 0 ? `Monday, May 5th` : `Sunday, May 4th`}
          </h2>
          
          <div className="relative border-4 border-black rounded-lg bg-white aspect-square">
            {/* Grid */}
            <div className="absolute top-0 left-0 w-full h-full bg-blue-100/40 rounded-lg overflow-hidden">
              {/* Horizontal line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-black"></div>
              
              {/* Vertical line */}
              <div className="absolute top-0 left-1/2 w-1 h-full bg-black"></div>
              
              {/* Top labels */}
              <div className="absolute top-0 left-0 w-full flex justify-center">
                <div className="text-2xl font-bold py-2">Kinky</div>
              </div>
              
              {/* Bottom labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-center">
                <div className="text-2xl font-bold py-2">Vanilla</div>
              </div>
              
              {/* Left labels */}
              <div className="absolute top-0 left-0 h-full flex flex-col justify-center items-center">
                <div 
                  className="text-2xl font-bold px-2 transform -rotate-90"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  Sub
                </div>
              </div>
              
              {/* Right labels */}
              <div className="absolute top-0 right-0 h-full flex flex-col justify-center items-center">
                <div 
                  className="text-2xl font-bold px-2 transform rotate-90"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  Dom
                </div>
              </div>
              
              {/* User avatars */}
              {placement.members.map(member => (
                <div 
                  key={member.id}
                  className={`absolute w-12 h-12 rounded-full border-2 ${getBorderColor(member.id)} ${getMemberColor(member.id)} flex items-center justify-center`}
                  style={{ 
                    left: `calc(${member.position?.x || 0.5} * 100% - 1.5rem)`,
                    top: `calc(${member.position?.y || 0.5} * 100% - 1.5rem)`,
                    fontFamily: 'Arial, sans-serif'
                  }}
                >
                  {member.avatar_url ? (
                    <img 
                      src={`https://randomuser.me/api/portraits/${parseInt(member.id) % 2 === 0 ? 'men' : 'women'}/${parseInt(member.id) + 10}.jpg`} 
                      alt={member.name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-white font-bold">
                      {member.name.substring(0, 2)}
                    </div>
                  )}
                </div>
              ))}
              
              {/* User names */}
              {placement.members.map(member => (
                <div 
                  key={`name-${member.id}`}
                  className="absolute text-xs text-center"
                  style={{ 
                    left: `calc(${member.position?.x || 0.5} * 100% - 1.5rem)`,
                    top: `calc(${member.position?.y || 0.5} * 100% + 1.5rem)`,
                    width: '3rem',
                    fontFamily: 'Arial, sans-serif'
                  }}
                >
                  {member.name}
                </div>
              ))}
            </div>
          </div>
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