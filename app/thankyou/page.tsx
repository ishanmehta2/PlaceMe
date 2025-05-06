'use client'

import Link from 'next/link'

export default function ThankYou() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm bg-[#FFF8E1] rounded-3xl overflow-hidden text-center">
        {/* Success header */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-4/5 mx-auto mb-6">
          <h1 className="text-4xl font-black text-center" style={{ 
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Thanks!
          </h1>
        </div>

        <div className="px-6 pb-6 space-y-6">
          <div className="text-2xl font-bold">
            You're all signed up!
          </div>
          
          <p className="text-lg">
            We've received your information and will be in touch soon.
          </p>
          
          <div className="pt-4">
            <Link 
              href="/"
              className="inline-block py-3 px-8 rounded-full text-white font-bold text-lg bg-[#FFE082] border-2 border-black"
              style={{ 
                textShadow: '1px 1px 0 #000',
                boxShadow: '3px 3px 0 #000'
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}