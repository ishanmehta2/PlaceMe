// components/ResultsPopup.tsx
'use client'

import { useResults } from '../hooks/useResults'
import { XMarkIcon } from '@heroicons/react/24/solid'
import ResultsView from './ResultsView'

interface ResultsPopupProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  axisId: string
  axisDate: string
}

export default function ResultsPopup({ isOpen, onClose, groupId, groupName, axisId, axisDate }: ResultsPopupProps) {
  const { loading, error, selectedGroup, dailyAxis, results } = useResults()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#FFF8E1] overflow-y-auto">
      {/* Header with close button */}
      <div className="sticky top-0 w-full z-20 bg-[#FFF8E1] flex items-center h-20 border-b-2 border-black">
        <button
          className="ml-6 flex items-center p-2"
          onClick={onClose}
          aria-label="Close results"
        >
          <XMarkIcon className="h-6 w-6 text-black" />
        </button>

        <div className="flex-1 flex justify-center items-center">
          <span
            className="text-2xl font-black text-black"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            Results - {axisDate}
          </span>
        </div>

        <div className="w-10 mr-6"></div> {/* Spacer for centering */}
      </div>

      {/* Main content */}
      <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
        <ResultsView
          groupId={groupId}
          groupName={groupName}
          dailyAxis={dailyAxis}
          results={results}
          loading={loading}
          error={error}
          onClose={onClose}
          isPopup={true}
        />
      </main>
    </div>
  )
}