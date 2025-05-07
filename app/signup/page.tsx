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
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      setImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

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
            // We'd need to store the image separately and just save the URL
          }
        }
      })

      if (signUpError) throw signUpError

      // 2. If we have an image, upload it to Supabase Storage
      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${authData.user?.id}-profile-image.${fileExt}`
        
        const { error: uploadError } = await supabase
          .storage
          .from('profile-images')
          .upload(fileName, image)
          
        if (uploadError) {
          console.error('Error uploading profile image:', uploadError)
          // Continue anyway - the user account is created
        } else {
          // Get the public URL for the uploaded image
          const { data: urlData } = supabase
            .storage
            .from('profile-images')
            .getPublicUrl(fileName)
            
          // Update the user's metadata with the profile image URL
          if (urlData) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: { 
                avatar_url: urlData.publicUrl 
              }
            })
            
            if (updateError) {
              console.error('Error updating user profile with image URL:', updateError)
            }
          }
        }
      }

      // 3. Create a record in the profiles table (if you have one)
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
          
          <div className="space-y-4 mt-2">
            <label className="block text-4xl font-black" style={{ 
              fontFamily: 'Arial, sans-serif'
            }}>
              Upload a Selfie
            </label>
            
            <div className="flex justify-center">
              <label htmlFor="selfie" className="cursor-pointer">
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
                <input
                  id="selfie"
                  name="selfie"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
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
                {loading ? 'Creating Account...' : 'Sign Up'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}