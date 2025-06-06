'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/auth/supabase'
import { useRouter } from 'next/navigation'
import { getUserAvatar } from '../../lib/avatars'

interface UserGroup {
  id: string
  name: string
  role: string
}

export default function Profile() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(true)

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

      // Fetch profile data
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

      // Fetch groups
      try {
        const { data: groupMemberships, error: groupsError } = await supabase
          .from('group_members')
          .select(`
            id,
            role,
            joined_at,
            group_id
          `)
          .eq('user_id', user.id)

        if (groupsError) {
          console.error('Error fetching group memberships:', groupsError)
          setGroups([])
        } else {
          const groupIds = groupMemberships.map((membership) => membership.group_id)

          if (groupIds.length === 0) {
            setGroups([])
          } else {
            const { data: groupsData, error: groupDetailsError } = await supabase
              .from('groups')
              .select('id, name, invite_code, settings, created_at')
              .in('id', groupIds)

            if (groupDetailsError) {
              console.error('Error fetching group details:', groupDetailsError)
              setGroups([])
            } else {
              const formattedGroups = groupsData.map((group) => {
                return {
                  id: group.id,
                  name: group.name,
                  role: '', // or you can keep role: membership?.role || 'member' if needed internally
                }
              })

              setGroups(formattedGroups)
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error fetching groups:', error)
        setGroups([])
      }

      setLoading(false)
    }

    fetchProfile()
  }, [router])

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <main className="flex min-h-screen flex-col items-center p-0 bg-[#FFF8E1]">
      {/* Back arrow button */}
      <button
        onClick={() => router.push('/home')}
        className="absolute top-4 left-4 text-3xl font-black z-50"
        aria-label="Go back home"
      >
        ←
      </button>

      {/* Profile Card */}
      <div className="bg-[#FFE082] rounded-3xl p-6 w-full max-w-md shadow-lg space-y-6 mt-20">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 bg-gray-300 rounded-full overflow-hidden">
            <img
              src={getUserAvatar(profile?.id || '', profile?.avatar_url)}
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
            {groups.length > 0 ? (
              <ul className="list-disc list-inside text-lg space-y-1">
                {groups.map((group) => (
                  <li key={group.id}>{group.name}</li>
                ))}
              </ul>
            ) : (
              <div className="text-lg text-gray-600">No groups yet</div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
