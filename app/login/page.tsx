'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // First, attempt to authenticate the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      // Get the user information
      const userId = authData.user?.id
      const userName = authData.user?.email || email
      
      // Log the login event in the login_events table
      const { error: logError } = await supabase
        .from('login_events')
        .insert([
          { 
            user_id: userId,
            email: email,
            timestamp: new Date().toISOString(),
            success: true,
            device_info: navigator.userAgent
          }
        ])

      if (logError) {
        console.error('Failed to log login event:', logError)
        // Continue anyway since the user is authenticated
      }

      alert('Login successful!')
      router.push('/')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to login')
      
      // Log failed login attempt
      try {
        await supabase
          .from('login_events')
          .insert([
            { 
              email: email,
              timestamp: new Date().toISOString(),
              success: false,
              device_info: navigator.userAgent
            }
          ])
      } catch (logErr) {
        console.error('Failed to log failed login attempt:', logErr)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm bg-[#FFF8E1] rounded-3xl overflow-hidden">
        {/* Header with Login text */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-4/5 mx-auto mb-6">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Log In
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label htmlFor="email" className="block text-4xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-2xl text-lg"
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="password" className="block text-4xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-2xl text-lg"
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
          </div>
          
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#60A5FA] py-3 px-6 rounded-full"
            >
              <span className="text-xl font-black" style={{ 
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                color: 'white',
                fontFamily: 'Arial, sans-serif'
              }}>
                {loading ? 'Loading...' : 'Log In'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}