'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SuggestAxis() {
  const router = useRouter()
  const [topLabel, setTopLabel] = useState('')
  const [bottomLabel, setBottomLabel] = useState('')
  const [leftLabel, setLeftLabel] = useState('')
  const [rightLabel, setRightLabel] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!topLabel && !bottomLabel && !leftLabel && !rightLabel) {
      setError('Please fill out at least one axis label.')
      return
    }

    try {
      const groupId = sessionStorage.getItem('currentGroupId')
      if (!groupId) throw new Error('Missing group ID.')

      const response = await fetch('/api/suggest_axis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupId,
          top_label: topLabel,
          bottom_label: bottomLabel,
          left_label: leftLabel,
          right_label: rightLabel
        })
      })

      if (!response.ok) throw new Error('Failed to submit suggestions.')

      router.push('/groups/place_yourself')
    } catch (err: any) {
      setError(err.message || 'Unexpected error occurred')
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      {/* Arrow back button top-left absolute */}
      <button
        onClick={() => router.push('/home')}
        aria-label="Go back to home"
        className="absolute top-4 left-4 text-4xl font-black text-black hover:text-gray-700 transition"
        style={{ fontFamily: 'Arial Black, Arial, sans-serif', lineHeight: 1 }}
      >
        ←
      </button>

      <div className="w-full max-w-sm">
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1 className="text-4xl font-black text-center" style={{
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Suggest Axis
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Top of Y-axis"
            value={topLabel}
            onChange={(e) => setTopLabel(e.target.value)}
            className="w-full p-3 border rounded-xl text-lg"
          />
          <input
            type="text"
            placeholder="Bottom of Y-axis"
            value={bottomLabel}
            onChange={(e) => setBottomLabel(e.target.value)}
            className="w-full p-3 border rounded-xl text-lg"
          />
          <input
            type="text"
            placeholder="Right of X-axis"
            value={rightLabel}
            onChange={(e) => setRightLabel(e.target.value)}
            className="w-full p-3 border rounded-xl text-lg"
          />
          <input
            type="text"
            placeholder="Left of X-axis"
            value={leftLabel}
            onChange={(e) => setLeftLabel(e.target.value)}
            className="w-full p-3 border rounded-xl text-lg"
          />
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={handleSubmit}
            className="bg-[#60A5FA] py-3 px-10 rounded-full"
          >
            <span className="text-xl font-black" style={{
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              color: 'white',
              fontFamily: 'Arial, sans-serif'
            }}>
              Submit
            </span>
          </button>
        </div>
      </div>
    </main>
  )
}
