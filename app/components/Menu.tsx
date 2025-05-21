'use client'

import Link from 'next/link'
import { useState } from 'react'

interface MenuProps {
  open: boolean
  onClose: () => void
  groupName: string
}

export default function Menu({ open, onClose, groupName }: MenuProps) {
  const [plusDropdownOpen, setPlusDropdownOpen] = useState(false)

  return (
    <>
      {/* Sidebar Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.10)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[70vw] max-w-[400px] bg-[#FFF8E1] shadow-2xl transition-transform duration-300 ease-in-out border-r-2 border-black flex flex-col rounded-br-[100px] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
      >
        {/* Close Button */}
        <button
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-transparent text-3xl"
          onClick={onClose}
          aria-label="Close menu"
        >
          ×
        </button>

        {/* Menu Content */}
        <div className="p-8 pt-20 flex flex-col gap-0">
          {/* Groups Section */}
          <div>
            <div className="text-5xl font-black mb-2">Groups</div>
            <div className="ml-2 text-2xl font-black mb-1">{groupName}</div>
            <hr className="ml-2 border-t border-black/10 my-2" />
            <div className="ml-2 text-2xl font-black mb-4">Simps</div>
            <hr className="border-t border-black/10 my-2" />
            <div className="ml-2 text-2xl font-black mb-1 cursor-pointer hover:underline">
              + Create Group
            </div>
            <div className="ml-2 text-2xl font-black mb-6 cursor-pointer hover:underline">
              + Join Group
            </div>
          </div>

          {/* Divider */}
          <hr className="border-t border-black/10 my-2" />

          {/* Profile Link */}
          <Link href="/groups/profile" passHref>
            <div className="text-4xl font-black mb-6 cursor-pointer hover:underline">
              View Profile
            </div>
          </Link>

          {/* Divider */}
          <hr className="border-t border-black/10 my-2" />

          {/* Log Out */}
          <div className="text-4xl font-black flex items-center gap-2 cursor-pointer hover:underline">
            Log Out
            <span className="inline-block border-2 border-black rounded-md p-1 ml-2">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
                <path d="M15 12H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
