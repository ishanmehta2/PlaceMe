'use client'

import React from "react";
import { useRouter } from "next/navigation";
import { FaCrown } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import { useCurrentGroup } from "../../hooks/useCurrentGroups";

const AdminTools: React.FC = () => {
  const router = useRouter()
  const { 
    currentGroup, 
    loading, 
    error, 
    isUserGroupCreator, 
    formattedCreatedDate 
  } = useCurrentGroup()
  
  const reportCount = 2;

  // Redirect if user is not the group creator
  React.useEffect(() => {
    if (!loading && !isUserGroupCreator) {
      console.log('User is not group creator, redirecting...')
      router.push('/home')
    }
  }, [loading, isUserGroupCreator, router])

  if (loading) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: "#FFF8E5" }}
      >
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: "#FFF8E5" }}
      >
        <div className="text-center">
          <div className="text-red-600 text-xl font-bold mb-4">Error: {error}</div>
          <button 
            onClick={() => router.push('/home')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  if (!currentGroup) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: "#FFF8E5" }}
      >
        <div className="text-center">
          <div className="text-xl font-bold mb-4">Group not found</div>
          <button 
            onClick={() => router.push('/home')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "#FFF8E5", display: "flex", flexDirection: "column" }}
    >
      {/* Back Arrow */}
      <div className="p-4">
        <IoIosArrowBack 
          size={28} 
          className="text-black cursor-pointer hover:text-gray-700" 
          onClick={() => router.push('/home')}
        />
      </div>

      {/* Main Content */}
      <div className="flex justify-center w-full">
        <div className="max-w-md w-full px-6">
          {/* Title */}
          <div className="flex items-center justify-center mb-6 gap-2">
            <h1 className="text-2xl font-black text-black drop-shadow-[2px_2px_0px_white]">
              Admin Tools
            </h1>
            <FaCrown className="text-black text-lg" />
          </div>

          {/* Dynamic Group Info */}
          <p className="text-[#B4B068] text-xl font-bold mb-1">
            Group Name: {currentGroup.name}
          </p>
          <p className="text-[#B4B068] text-xl font-bold mb-6">
            Created: {formattedCreatedDate}
          </p>

          <div className="mb-4">
            <p className="text-2xl font-extrabold flex items-center gap-2">
              <span>Group Members ({currentGroup.member_count || 0})</span>
              {reportCount > 1 && (
                <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {reportCount}
                </span>
              )}
            </p>
          </div>

          <p className="text-2xl font-extrabold">All Axes</p>
          
          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <p>Group ID: {currentGroup.id}</p>
              <p>Creator: {currentGroup.creator_name}</p>
              <p>Is Creator: {isUserGroupCreator ? 'Yes' : 'No'}</p>
              <p>Invite Code: {currentGroup.invite_code}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTools;