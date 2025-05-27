import React from "react";
import { FaCrown } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";

const AdminTools: React.FC = () => {
  const reportCount = 2;

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "#FFF8E5", display: "flex", flexDirection: "column" }}
    >
      {/* Back Arrow */}
      <div className="p-4">
        <IoIosArrowBack size={28} className="text-black" />
      </div>

      {/* Main Content */}
      <div className="flex justify-center w-full">
        <div className="max-w-md w-full px-6">
          {/* Title */}
          <div className="flex items-center justify-center mb-6 gap-2">
            <h1 className="text-2xl font-black text-black drop-shadow-[2px_2px_0px_white]">
              Admin Tools
            </h1>
            <FaCrown className="text-yellow-600" />
          </div>

          <p className="text-[#B4B068] text-xl font-bold mb-1">Group Name: Robber Barons</p>
          <p className="text-[#B4B068] text-xl font-bold mb-6">Created: 04/23/2025</p>
          <p className="text-[#B4B068] text-xl font-bold mb-11"></p>


          <div className="mb-4">
            <p className="text-2xl font-extrabold flex items-center gap-2">
              <span>Group Members</span>
              {reportCount > 1 && (
                <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {reportCount}
                </span>
              )}
            </p>
          </div>

          <p className="text-2xl font-extrabold">All Axes</p>
        </div>
      </div>
    </div>
  );
};

export default AdminTools;
