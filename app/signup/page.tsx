'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/auth/supabase'

export default function SignUp() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          }
        }
      })

      if (signUpError) throw signUpError

      // 2. Create a record in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: authData.user?.id,
            name: name,
            email: email,
            phone: phone,
            created_at: new Date().toISOString()
          }
        ])

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Continue anyway - the user account is created
      }

      alert('Signup successful!')
      router.push('/groups/group_initialization')
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm bg-[#FFF8E1] rounded-3xl overflow-hidden">
        {/* Header with Sign Up text */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-4/5 mx-auto mb-6">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Sign Up
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}
        
          <div className="space-y-1">
            <label htmlFor="name" className="block text-4xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Name<span className="text-black">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-2xl text-lg"
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="email" className="block text-4xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Email<span className="text-black">*</span>
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
              Password<span className="text-black">*</span>
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
          
          <div className="space-y-1">
            <label htmlFor="phone" className="block text-4xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-2xl text-lg"
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
          </div>
          
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#60A5FA] py-3 px-8 rounded-full w-64 active:bg-[#3B82F6] transition-colors"
            >
              <span className="text-3xl font-black" style={{ 
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                color: 'white',
                fontFamily: 'Arial, sans-serif'
              }}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}