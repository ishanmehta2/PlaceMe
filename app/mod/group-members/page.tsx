"use client";

import React, { useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { FaCrown } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";

const members = [
  { name: "Samantha", isAdmin: true, reports: 0, avatar: "/avatars/samantha.jpg" },
  { name: "Janina", isAdmin: true, reports: 0, avatar: "/avatars/janina.jpg" },
  { name: "Nils", isAdmin: false, reports: 0, avatar: "/avatars/nils.jpg" },
  { name: "Ishan", isAdmin: false, reports: 2, avatar: "/avatars/ishan.jpg" },
  { name: "Ghost", isAdmin: false, reports: 0, avatar: "/avatars/ghost.jpg" },
];

const GroupMembers: React.FC = () => {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  const toggleMenu = (index: number) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  return (
    <div className="bg-[#FFF8E5] min-h-screen flex justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-xl p-6 shadow-md">
        {/* Header */}
        <div className="flex items-center mb-8">
          <IoIosArrowBack size={24} className="text-black" />
          <h1 className="text-2xl font-black flex-1 text-center text-black">
            Group Members
          </h1>
        </div>

        {/* Member List */}
        <div className="flex flex-col gap-6">
          {members.map((member, index) => (
            <div key={index} className="flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <p className="text-lg font-semibold">{member.name}</p>
              </div>

              <div className="flex items-center gap-2 relative">
                {member.isAdmin ? (
                  <FaCrown className="text-yellow-600" />
                ) : (
                  <>
                    {member.reports > 0 && (
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full absolute -top-2 -right-4">
                        {member.reports}
                      </span>
                    )}
                    <BsThreeDotsVertical
                      size={20}
                      className="text-gray-600 cursor-pointer"
                      onClick={() => toggleMenu(index)}
                    />

                    {/* Popup Menu */}
                    {openMenuIndex === index && (
                      <div className="absolute right-0 top-8 z-10 bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 w-52">
                        {member.reports > 0 && (
                          <button className="text-red-600 font-bold text-base text-left">
                            View <span className="bg-red-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">{member.reports}</span> Reports
                          </button>
                        )}
                        <button className="text-red-600 font-bold text-base text-left">
                          Remove {member.name}
                        </button>
                        <button className="text-black font-bold text-base text-left flex items-center gap-2">
                          <FaCrown className="text-yellow-600" />
                          Make admin
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupMembers;
