'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useResults } from '../../hooks/useResults'
import { useComments } from '../../hooks/useComments'
import Axis from '../../components/Axis'
import Token from '../../components/Token'
import { ArrowLeftIcon, ChevronDownIcon } from '@heroicons/react/24/solid'

// Constants
const AXIS_SIZE = 300
const TOKEN_SIZE = 35
const GUESS_TOKEN_SIZE = 25

export default function Results() {
  const router = useRouter()
  const { loading, error, selectedGroup, results } = useResults()
  const [view, setView] = useState<'self' | 'guessed'>('self')
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const commentsEndRef = useRef<HTMLDivElement | null>(null)

  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    addComment,
    deleteComment
  } = useComments(selectedGroup?.id || null, selectedToken, view)

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

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/groups/place_yourself')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Start Over
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

        {/* Group Info */}
        {selectedGroup && (
          <div className="text-center mb-4 mt-8">
            <h2 className="text-xl font-bold text-gray-700">{selectedGroup.name}</h2>
            <p className="text-sm text-gray-600">Results</p>
          </div>
        )}

        {/* Toggle Filter */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-200 rounded-full p-1 w-fit">
            <button
              className={`px-4 py-1 rounded-full text-sm font-bold transition-all duration-150 ${
                view === 'self' ? 'bg-white border-2 border-black shadow' : 'text-gray-500'
              }`}
              onClick={() => {
                setView('self')
                setSelectedToken(null)
              }}
            >
              self placed
            </button>
            <button
              className={`px-4 py-1 rounded-full text-sm font-bold transition-all duration-150 ml-1 ${
                view === 'guessed' ? 'bg-white border-2 border-black shadow' : 'text-gray-500'
              }`}
              onClick={() => {
                setView('guessed')
                setSelectedToken(null)
              }}
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

        {/* Axis */}
        {(view === 'self' && results.selfPlaced.length === 0) || (view === 'guessed' && results.guessed.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 mb-4">
              {view === 'self'
                ? 'No self-placements found for this group'
                : 'No one has guessed your position yet'}
            </p>
          </div>
        ) : (
          <div className="relative">
            <Axis
              size={AXIS_SIZE}
              labels={{
                top: 'Wet Sock',
                bottom: 'Dry Tongue',
                left: 'Tree Hugger',
                right: 'Lumberjack'
              }}
              labelColors={{
                top: 'rgba(251, 207, 232, 0.95)',
                bottom: 'rgba(167, 243, 208, 0.95)',
                left: 'rgba(221, 214, 254, 0.95)',
                right: 'rgba(253, 230, 138, 0.95)'
              }}
            >
              <div
                className="absolute inset-0 z-10"
                onClick={() => setSelectedToken(null)}
              />

              {view === 'self' &&
                results.selfPlaced.map(token => (
                  <div
                    key={token.user_id}
                    style={{
                      position: 'absolute',
                      left: `${token.x}%`,
                      top: `${token.y}%`,
                      transform: 'translate(-50%, -50%)',
                      transition: 'all 0.3s ease-in-out',
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
                      color={token.color}
                      size={TOKEN_SIZE}
                      imageUrl={token.avatar_url}
                      showTooltip={false}
                      isSelected={selectedToken === token.user_id}
                    />
                  </div>
                ))
              }

              {view === 'guessed' &&
                results.guessed.map(guessedResult => (
                  <div key={guessedResult.user_id}>
                    {guessedResult.individualGuesses.map((guess, index) => (
                      <div
                        key={`guess-${index}`}
                        style={{
                          position: 'absolute',
                          left: `${guess.position.x}%`,
                          top: `${guess.position.y}%`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 5,
                          opacity: 0.4,
                          pointerEvents: 'none',
                        }}
                      >
                        <Token
                          id={`guess-${index}`}
                          name={guess.guesser_name}
                          x={0}
                          y={0}
                          color={guessedResult.color}
                          size={GUESS_TOKEN_SIZE}
                          imageUrl={guess.guesser_avatar}
                          showTooltip={true}
                        />
                      </div>
                    ))}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${guessedResult.averagePosition.x}%`,
                        top: `${guessedResult.averagePosition.y}%`,
                        transform: 'translate(-50%, -50%)',
                        transition: 'all 0.3s ease-in-out',
                        zIndex: selectedToken === guessedResult.user_id ? 15 : 10,
                        cursor: 'pointer',
                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedToken(selectedToken === guessedResult.user_id ? null : guessedResult.user_id)
                      }}
                    >
                      <Token
                        id={guessedResult.user_id}
                        name={guessedResult.username}
                        x={0}
                        y={0}
                        color={guessedResult.color}
                        size={TOKEN_SIZE + 5}
                        imageUrl={guessedResult.avatar_url}
                        showTooltip={false}
                        isSelected={selectedToken === guessedResult.user_id}
                      />
                    </div>
                  </div>
                ))
              }
            </Axis>
          </div>
        )}
      </div>

      {/* Comments Panel */}
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
                  src={selectedTokenInfo.avatar_url || selectedTokenInfo.userAvatar}
                  alt="avatar"
                  className="w-12 h-12 rounded-full border-4"
                  style={{ borderColor: selectedTokenInfo.color || '#A855F7' }}
                />
              </div>
            </div>

            <div className="px-6 pb-4 pt-2">
              <div className="rounded-3xl bg-[#FFFAED] p-4 min-h-[120px] max-h-[200px] overflow-y-auto text-lg font-semibold">
                {commentsLoading ? (
                  <div className="text-gray-500 text-center py-4">Loading comments...</div>
                ) : commentsError ? (
                  <div className="text-red-500 text-center py-4">Error: {commentsError}</div>
                ) : comments.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">No comments yet.</div>
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
                placeholder="Write a comment…"
                className="flex-1 rounded-full bg-[#F3F1E6] border-none px-5 py-3 text-lg placeholder:text-[#C2B68A] focus:outline-none focus:ring-2 focus:ring-[#EADFA7]"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={!selectedToken || commentsLoading}
              />
              <button
                onClick={handleAddComment}
                className="bg-[#60A5FA] rounded-full px-6 py-3 font-bold text-white border-2 border-[#3B82F6] hover:bg-[#3B82F6] transition disabled:opacity-50"
                disabled={!newComment.trim() || commentsLoading}
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
