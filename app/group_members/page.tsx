"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCrown } from "react-icons/fa";

const users = [
  {
    name: "Alex",
    avatar: "/avatars/alex.jpg",
    isMod: false,
  },
  {
    name: "Jamie",
    avatar: "/avatars/jamie.jpg",
    isMod: true,
  },
  {
    name: "Samantha",
    avatar: "/avatars/samantha.jpg",
    isMod: false,
  },
];

const GroupMembersPage: React.FC = () => {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [reportingIndex, setReportingIndex] = useState<number | null>(null);
  const [reportComment, setReportComment] = useState("");

  const handleReportSubmit = () => {
    const reportedUser = users[reportingIndex!];
    console.log("Reported:", reportedUser.name, "Comment:", reportComment);
    setReportingIndex(null);
    setReportComment("");
  };

  return (
    <div className="min-h-screen bg-[#FFF2CC] text-black p-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-black text-center mb-6">Group Members</h1>

        <div className="flex flex-col gap-4">
          {users
            .map((u, i) => ({ ...u, originalIndex: i })) // track original index
            .sort((a, b) => Number(b.isMod) - Number(a.isMod)) // sort mods first
            .map((user, displayIndex) => {
              const originalIndex = user.originalIndex;
              return (
                <div
                  key={displayIndex}
                  className="relative bg-white rounded-xl shadow-md p-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <span className="font-semibold">{user.name}</span>
                  </div>

                  <div>
                    {user.isMod ? (
                      <FaCrown className="text-yellow-500 text-xl" title="Moderator" />
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuIndex(openMenuIndex === originalIndex ? null : originalIndex)
                          }
                        >
                          <BsThreeDotsVertical className="text-xl" />
                        </button>

                        {openMenuIndex === originalIndex && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-10 w-40">
                            <button
                              onClick={() => {
                                setReportingIndex(originalIndex);
                                setOpenMenuIndex(null);
                              }}
                              className="w-full text-left px-4 py-2 text-red-600 font-semibold border-b border-gray-200"
                            >
                              Report
                            </button>
                            <button
                              onClick={() => setOpenMenuIndex(null)}
                              className="w-full text-left px-4 py-2"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Report Modal */}
                  {reportingIndex === originalIndex && (
                    <div className="absolute z-20 top-full mt-2 right-0 w-72 bg-white rounded-xl shadow-xl p-4">
                      <h2 className="font-bold text-lg mb-2">Report</h2>
                      <textarea
                        className="w-full border border-gray-300 rounded-md p-2 text-sm mb-3"
                        placeholder="Optional comment"
                        value={reportComment}
                        onChange={(e) => setReportComment(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mb-3">
                        Reports are anonymous and only seen by moderators.
                      </p>
                      <button
                        onClick={handleReportSubmit}
                        className="w-full text-red-600 font-bold border-t border-gray-300 pt-2"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default GroupMembersPage;
