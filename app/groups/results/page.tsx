'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useResults } from '../../hooks/useResults'
import { useComments } from '../../hooks/useComments'
import Axis from '../../components/Axis'
import Token from '../../components/Token'
import { ArrowLeftIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import { getUserAvatar } from '../../lib/avatars'

// Constants
const AXIS_SIZE = 300
const TOKEN_SIZE = 35
const GUESS_TOKEN_SIZE = 25

// Color generation constants
const COLORS = [
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#45B7D1', // blue
  '#96CEB4', // mint
  '#FFEEAD', // yellow
  '#D4A5A5', // pink
  '#9B59B6', // purple
  '#3498DB', // light blue
  '#E67E22', // orange
  '#2ECC71', // green
]

// Function to generate a consistent color for a user ID
function getUserColor(userId: string): string {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use the hash to select a color
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Results() {
  const router = useRouter()
  const { loading, error, selectedGroup, dailyAxis, results } = useResults()
  const [view, setView] = useState<'self' | 'guessed'>('self')
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement | null>(null)

  // UPDATED: Pass axis_id to useComments for axis-specific comments
  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    addComment,
    deleteComment
  } = useComments(
    selectedGroup?.id || null, 
    selectedToken, 
    view,
    dailyAxis?.id || null // NEW: Pass the current axis ID
  )

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  const handleAddComment = async () => {
    if (!selectedToken || !newComment.trim()) return
    try {
      await addComment(newComment.trim())
      setNewComment('')
    } catch (err: any) {
      console.error('Failed to add comment:', err)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddComment()
    }
  }

  const getSelectedTokenInfo = () => {
    if (!selectedToken) return null
    return view === 'self'
      ? results.selfPlaced.find(t => t.user_id === selectedToken)
      : results.guessed.find(g => g.user_id === selectedToken)
  }

  const selectedTokenInfo = getSelectedTokenInfo()

  const handleViewChange = (newView: 'self' | 'guessed') => {
    if (newView === view) return
    setIsTransitioning(true)
    setSelectedToken(null)
    setView(newView)
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 500) // Match this with the CSS transition duration
  }

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

        {/* Group Info - ENHANCED with Axis Info */}
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-4 mt-8">
          <h3 className="font-bold text-lg mb-2">Results for:</h3>
          <div className="flex justify-between items-center">
            <span className="font-medium">{selectedGroup.name}</span>
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
              COMPLETE
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <div>Axis ID: {dailyAxis.id}</div>
            <div>Generated: {dailyAxis.date_generated}</div>
            <div>Labels: {dailyAxis.top_label} / {dailyAxis.bottom_label} × {dailyAxis.left_label} / {dailyAxis.right_label}</div>
          </div>
        </div>

        {/* Toggle Filter */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-200 rounded-full p-1 w-fit">
            <button
              className={`px-4 py-1 rounded-full text-sm font-bold transition-all duration-150 ${
                view === 'self' ? 'bg-white border-2 border-black shadow' : 'text-gray-500'
              }`}
              onClick={() => handleViewChange('self')}
            >
              self placed
            </button>
            <button
              className={`px-4 py-1 rounded-full text-sm font-bold transition-all duration-150 ml-1 ${
                view === 'guessed' ? 'bg-white border-2 border-black shadow' : 'text-gray-500'
              }`}
              onClick={() => handleViewChange('guessed')}
            >
              guessed
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            {view === 'self'
              ? `${results.selfPlaced.length} member${results.selfPlaced.length !== 1 ? 's' : ''} placed themselves`
              : results.guessed.length > 0
                ? `${results.guessed[0].individualGuesses.length} member${results.guessed[0].individualGuesses.length !== 1 ? 's' : ''} guessed where you are`
                : 'No one has guessed your position yet'}
          </p>
        </div>

        {/* Axis Display */}
        {(view === 'self' && results.selfPlaced.length === 0) || (view === 'guessed' && results.guessed.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 mb-4">
              {view === 'self'
                ? 'No self-placements found for this axis'
                : 'No one has guessed your position yet'}
            </p>
          </div>
        ) : (
          <div className="relative">
            <Axis
              size={AXIS_SIZE}
              labels={dailyAxis.labels}
              labelColors={dailyAxis.labels.labelColors}
            >
              <div
                className="absolute inset-0 z-10"
                onClick={() => setSelectedToken(null)}
              />

              {/* Render all tokens at once, controlling their visibility and position based on view */}
              {results.selfPlaced.map(token => {
                // Find the corresponding guessed result if it exists
                const guessedResult = results.guessed.find(g => g.user_id === token.user_id)
                
                // Determine the position based on current view
                const position = view === 'self' 
                  ? { x: token.x, y: token.y }
                  : guessedResult 
                    ? { x: guessedResult.averagePosition.x, y: guessedResult.averagePosition.y }
                    : null

                // Skip rendering if no position in current view
                if (!position) return null

                return (
                  <div
                    key={token.user_id}
                    style={{
                      position: 'absolute',
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      transition: 'all 0.5s ease-in-out',
                      zIndex: selectedToken === token.user_id ? 15 : 10,
                      opacity: selectedToken && selectedToken !== token.user_id ? 0.6 : 1,
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedToken(selectedToken === token.user_id ? null : token.user_id)
                    }}
                  >
                    <Token
                      id={token.user_id}
                      name={token.username}
                      x={0}
                      y={0}
                      color={getUserColor(token.user_id)}
                      size={TOKEN_SIZE}
                      imageUrl={token.avatar_url}
                      showTooltip={false}
                      isSelected={selectedToken === token.user_id}
                    />
                  </div>
                )
              })}

              {/* Render individual guesses only when a token is selected */}
              {selectedToken && view === 'guessed' && 
                results.guessed
                  .find(g => g.user_id === selectedToken)
                  ?.individualGuesses.map((guess, index) => (
                    <div
                      key={`guess-${selectedToken}-${index}`}
                      style={{
                        position: 'absolute',
                        left: `${guess.position.x}%`,
                        top: `${guess.position.y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 20,
                        opacity: 0.8,
                        transition: 'opacity 0.3s ease-in-out',
                      }}
                    >
                      <Token
                        id={`guess-${selectedToken}-${index}`}
                        name={`placed by ${guess.guesser_name}`}
                        x={0}
                        y={0}
                        color={getUserColor(selectedToken)}
                        size={GUESS_TOKEN_SIZE}
                        imageUrl={guess.guesser_avatar}
                        showTooltip={true}
                      />
                    </div>
                  ))
              }
            </Axis>
          </div>
        )}

        {/* Navigation - ENHANCED */}
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

      {/* Comments Panel - UPDATED for Axis-specific Comments */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#FFF5D6] rounded-t-[36px] shadow-2xl transition-transform duration-300 ease-in-out transform ${
          selectedToken ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '70vh',
          minHeight: '320px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)'
        }}
      >
        {selectedToken && selectedTokenInfo && (
          <>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <button
                onClick={() => setSelectedToken(null)}
                aria-label="Close comments"
                className="p-1 mr-1"
              >
                <ChevronDownIcon className="h-7 w-7 text-black" />
              </button>
              <div className="flex-1 flex justify-center items-center">
                <span className="text-3xl font-black" style={{ fontFamily: 'Arial Black' }}>
                  comments
                </span>
              </div>
              <div className="ml-2 flex items-center justify-center">
                <img
                  src={getUserAvatar(selectedTokenInfo.user_id, selectedTokenInfo.avatar_url)}
                  alt="avatar"
                  className="w-12 h-12 rounded-full border-4"
                  style={{ borderColor: getUserColor(selectedTokenInfo.user_id) }}
                />
              </div>
            </div>

            {/* ENHANCED: Show axis context for comments */}
            <div className="px-6 pb-2">
              <div className="text-xs text-gray-600 text-center">
                Comments for {selectedTokenInfo.username} on {dailyAxis.date_generated}
              </div>
            </div>

            <div className="px-6 pb-4 pt-2">
              <div className="rounded-3xl bg-[#FFFAED] p-4 min-h-[120px] max-h-[200px] overflow-y-auto text-lg font-semibold">
                {commentsLoading ? (
                  <div className="text-gray-500 text-center py-4">Loading comments...</div>
                ) : commentsError ? (
                  <div className="text-red-500 text-center py-4">Error: {commentsError}</div>
                ) : comments.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    No comments yet for this placement.
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="mb-3 last:mb-0">
                      <span className="font-bold">{comment.author}:</span> {comment.text}
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-2">
              <input
                type="text"
                placeholder="Comment on this placement…"
                className="flex-1 rounded-full bg-[#F3F1E6] border-none px-5 py-3 text-lg placeholder:text-[#C2B68A] focus:outline-none focus:ring-2 focus:ring-[#EADFA7]"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={!selectedToken || commentsLoading || !dailyAxis}
              />
              <button
                onClick={handleAddComment}
                className="bg-[#60A5FA] rounded-full px-6 py-3 font-bold text-white border-2 border-[#3B82F6] hover:bg-[#3B82F6] transition disabled:opacity-50"
                disabled={!newComment.trim() || commentsLoading || !dailyAxis}
              >
                {commentsLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}