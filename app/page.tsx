'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'



import { useRouter } from 'next/navigation'


export default function Home() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* PlaceMe Logo */}
        <h1 className="text-6xl font-black mb-10" style={{ 
          textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          PLACE ME
        </h1>

        {/* Color Wheel */}
        <div className="mb-12 w-56 h-56">
          <svg viewBox="0 0 300 300" className="w-full h-full">
            {/* Color wheel with concentric rings */}
            {/* Outer Ring */}
            <g>
              {/* Red segment */}
              <path d="M150,150 L230,80 A120,120 0 0,1 270,150 z" fill="#E53E3E"/>
              {/* Orange segment */}
              <path d="M150,150 L270,150 A120,120 0 0,1 230,220 z" fill="#ED8936"/>
              {/* Yellow segment */}
              <path d="M150,150 L230,220 A120,120 0 0,1 150,270 z" fill="#ECC94B"/>
              {/* Green segment */}
              <path d="M150,150 L150,270 A120,120 0 0,1 70,220 z" fill="#48BB78"/>
              {/* Blue segment */}
              <path d="M150,150 L70,220 A120,120 0 0,1 30,150 z" fill="#4299E1"/>
              {/* Indigo segment */}
              <path d="M150,150 L30,150 A120,120 0 0,1 70,80 z" fill="#4C51BF"/>
              {/* Purple segment */}
              <path d="M150,150 L70,80 A120,120 0 0,1 150,30 z" fill="#9F7AEA"/>
              {/* Pink segment */}
              <path d="M150,150 L150,30 A120,120 0 0,1 230,80 z" fill="#D53F8C"/>
            </g>

            {/* Middle Ring */}
            <g opacity="0.75">
              <path d="M150,150 L205,95 A80,80 0 0,1 230,150 z" fill="#FC8181"/>
              <path d="M150,150 L230,150 A80,80 0 0,1 205,205 z" fill="#F6AD55"/>
              <path d="M150,150 L205,205 A80,80 0 0,1 150,230 z" fill="#F6E05E"/>
              <path d="M150,150 L150,230 A80,80 0 0,1 95,205 z" fill="#68D391"/>
              <path d="M150,150 L95,205 A80,80 0 0,1 70,150 z" fill="#63B3ED"/>
              <path d="M150,150 L70,150 A80,80 0 0,1 95,95 z" fill="#7F9CF5"/>
              <path d="M150,150 L95,95 A80,80 0 0,1 150,70 z" fill="#B794F4"/>
              <path d="M150,150 L150,70 A80,80 0 0,1 205,95 z" fill="#F687B3"/>
            </g>

            {/* Inner Ring */}
            <g opacity="0.5">
              <path d="M150,150 L180,120 A42,42 0 0,1 192,150 z" fill="#FEB2B2"/>
              <path d="M150,150 L192,150 A42,42 0 0,1 180,180 z" fill="#FBD38D"/>
              <path d="M150,150 L180,180 A42,42 0 0,1 150,192 z" fill="#FAF089"/>
              <path d="M150,150 L150,192 A42,42 0 0,1 120,180 z" fill="#9AE6B4"/>
              <path d="M150,150 L120,180 A42,42 0 0,1 108,150 z" fill="#90CDF4"/>
              <path d="M150,150 L108,150 A42,42 0 0,1 120,120 z" fill="#A3BFFA"/>
              <path d="M150,150 L120,120 A42,42 0 0,1 150,108 z" fill="#D6BCFA"/>
              <path d="M150,150 L150,108 A42,42 0 0,1 180,120 z" fill="#FBB6CE"/>
            </g>

            {/* Center Circle */}
            <circle cx="150" cy="150" r="20" fill="#FFFFFF" opacity="0.7"/>
            
            {/* Thin white dividing lines */}
            <line x1="150" y1="30" x2="150" y2="270" stroke="white" strokeWidth="1"/>
            <line x1="30" y1="150" x2="270" y2="150" stroke="white" strokeWidth="1"/>
            <line x1="70" y1="80" x2="230" y2="220" stroke="white" strokeWidth="1"/>
            <line x1="70" y1="220" x2="230" y2="80" stroke="white" strokeWidth="1"/>
            
            {/* Concentric circles */}
            <circle cx="150" cy="150" r="42" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="150" cy="150" r="80" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="150" cy="150" r="120" fill="none" stroke="white" strokeWidth="1"/>
          </svg>
        </div>

        {/* Buttons */}
        <button 
          onClick={() => router.push('/signup')}
          className="w-64 py-3 mb-4 bg-[#60A5FA] rounded-full"
        >
          <span className="text-3xl font-black" style={{ 
            textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Sign Up
          </span>
        </button>
        
        <button 
          onClick={() => router.push('/login')}
          className="w-64 py-3 bg-[#60A5FA] rounded-full"
        >
          <span className="text-3xl font-black" style={{ 
            textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            Log In
          </span>
        </button>
      </div>
    </main>
  )
}
