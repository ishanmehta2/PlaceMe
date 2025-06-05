'use client'

import { useRouter } from 'next/navigation'
import { useResults } from '../../hooks/useResults'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import ResultsView from '../../components/ResultsView'

export default function Results() {
  const router = useRouter()
  const { loading, error, selectedGroup, dailyAxis, results } = useResults()

  // Loading state - wait for all required data
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading results...</div>
        <div className="text-sm text-gray-600 mt-2">Loading group data and placements...</div>
      </main>
    )
  }

  // Error state - show any errors that occurred
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
          {error}
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/groups/place_yourself')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            Start New Workflow
          </button>
          <button
            onClick={() => router.push('/home')}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </main>
    )
  }

  // Missing group or axis state
  if (!selectedGroup || !dailyAxis) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-2xl mb-4">
          {!selectedGroup ? 'No workflow group found.' : 'No daily axis data found.'} Please start a new workflow.
        </div>
        <button
          onClick={() => router.push('/groups/place_yourself')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Start New Workflow
        </button>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm relative">
        {/* Back Button */}
        <button
          className="absolute left-0 top-0 flex items-center p-2"
          onClick={() => router.push('/home')}
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="h-6 w-6 text-black" />
        </button>

        <ResultsView
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          dailyAxis={dailyAxis}
          results={results}
          loading={loading}
          error={error}
        />

        {/* Navigation */}
        <div className="flex justify-center mt-8 space-x-4">
          <button
            onClick={() => router.push('/home')}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Home
          </button>
          <button
            onClick={() => router.push('/groups/place_yourself')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            New Round
          </button>
        </div>
      </div>
    </main>
  )
}