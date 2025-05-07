'use client'

import { useRouter } from 'next/navigation'

export default function GroupInitialization() {
  const router = useRouter()

  const handleCreateGroup = () => {
    router.push('/groups/create_group')
  }

  const handleJoinGroup = () => {
    router.push('/groups/join_group')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm flex flex-col items-center space-y-12">
        {/* Create Group Button */}
        <button 
          onClick={handleCreateGroup}
          className="w-64 py-5 bg-[#60A5FA] rounded-full"
        >
          <span className="text-4xl font-black" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Create Group
          </span>
        </button>

        {/* OR text */}
        <div className="text-4xl font-black" style={{ 
          textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          or
        </div>

        {/* Join Group Button */}
        <button 
          onClick={handleJoinGroup}
          className="w-64 py-5 bg-[#60A5FA] rounded-full"
        >
          <span className="text-4xl font-black" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Join Group
          </span>
        </button>
      </div>
    </main>
  )
}