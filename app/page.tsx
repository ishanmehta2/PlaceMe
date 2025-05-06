'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'


import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the signup page
    router.push('/signup')
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
      <div className="text-2xl font-bold">
        Redirecting to signup...
      </div>
    </main>
  )
}
