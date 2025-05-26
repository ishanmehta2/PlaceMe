'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/auth/supabase'
import { useRouter } from 'next/navigation'
import Menu from '../../components/Menu'

export default function Profile() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [groups, setGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile({
          ...data,
          avatar_url: user.user_metadata?.avatar_url,
        })
      }

      const { data: groupData, error: groupError } = await supabase
        .from('user_groups')
        .select('group_name')
        .eq('user_id', user.id)

      if (groupError) {
        console.error('Error fetching groups:', groupError)
      } else {
        setGroups(groupData?.map((g) => g.group_name) || [])
      }

      setLoading(false)
    }

    fetchProfile()
  }, [router])

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <main className="flex min-h-screen flex-col items-center p-0 bg-[#FFF8E1]">
      {/* Slide-out Menu */}
      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        groupName={groups[0] || 'My Group'}
      />

      <button
        onClick={() => setMenuOpen(true)}
        className="absolute top-4 left-4 text-3xl font-black z-50"
      >
        ☰
      </button>

      {/* Profile Card */}
      <div className="bg-[#FFE082] rounded-3xl p-6 w-full max-w-md shadow-lg space-y-6 mt-20">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 bg-gray-300 rounded-full overflow-hidden">
            <img
              src={profile?.avatar_url || '/default-avatar.png'}
              alt="Profile"
              className="object-cover w-full h-full"
            />
          </div>
          <h1 className="text-4xl font-black text-center">{profile?.name}</h1>
        </div>

        <div className="text-left space-y-2">
          <div>
            <div className="text-xl font-bold">Email:</div>
            <div className="text-lg">{profile?.email}</div>
          </div>

          <div className="mt-4">
            <div className="text-xl font-bold">Password:</div>
            <div className="text-lg">********</div>
          </div>

          <div className="mt-4">
            <div className="text-xl font-bold">Phone:</div>
            <div className="text-lg">{profile?.phone || 'N/A'}</div>
          </div>

          <div className="mt-4">
            <div className="text-xl font-bold">Groups:</div>
            <ul className="list-disc list-inside text-lg">
              {groups.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
