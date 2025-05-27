"use client";

import React, { useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import Image from "next/image";

const axes = [
  {
    x: ["pizza", "hot dog"],
    y: ["bowling", "movies"],
    date: "05/22/2025",
    avatar: "/avatars/samantha.jpg",
  },
  {
    x: ["bonk", "boink"],
    y: ["ruff", "meow"],
    date: "05/20/2025",
    avatar: "/avatars/nils.jpg",
  },
];

const labelColors = [
  "bg-red-300",
  "bg-green-300",
  "bg-yellow-300",
  "bg-blue-300",
  "bg-pink-300",
  "bg-purple-300",
];

const AllAxesPage: React.FC = () => {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);
  const [axisList, setAxisList] = useState(axes);

  const handleRemove = (index: number) => {
    setAxisList((prev) => prev.filter((_, i) => i !== index));
    setConfirmRemoveIndex(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF2CC] text-black p-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex items-center mb-6">
          <IoIosArrowBack size={24} className="text-black" />
          <h1 className="text-2xl font-black text-center flex-1">All Axes</h1>
        </div>

        <div className="flex flex-col gap-4">
          {axisList.map((axis, index) => (
            <div
              key={index}
              className="relative bg-white rounded-xl shadow-md p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={axis.avatar}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-xs font-semibold text-gray-700">
                  {axis.date}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="flex flex-wrap gap-1 justify-center">
                  {[...axis.x, ...axis.y].map((label, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 text-sm font-bold rounded-md ${labelColors[i % labelColors.length]}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setOpenMenuIndex(index === openMenuIndex ? null : index);
                    setConfirmRemoveIndex(null);
                  }}
                  className="text-xl font-black ml-2"
                >
                  ×
                </button>

                {openMenuIndex === index && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-10 w-48">
                    <button
                      className="text-red-600 w-full py-2 text-center font-bold border-b border-gray-200"
                      onClick={() => {
                        setConfirmRemoveIndex(index);
                        setOpenMenuIndex(null);
                      }}
                    >
                      Remove axis
                    </button>
                    <button
                      className="w-full py-2 text-center"
                      onClick={() => setOpenMenuIndex(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {confirmRemoveIndex === index && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-10 w-64 p-4 text-center">
                    <p className="font-bold mb-2">Remove axis?</p>
                    <p className="text-sm text-gray-600 mb-4">
                    This axis will be removed from the group’s history and current feed.
                    </p>
                    <hr className="border-t border-gray-300 mb-2" />
                    <button
                    onClick={() => handleRemove(index)}
                    className="font-bold text-red-600 w-full"
                    >
                    Confirm
                    </button>
                </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllAxesPage;
