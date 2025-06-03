'use client';

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCrown } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/auth/supabase";
import { IoArrowBack } from "react-icons/io5"; // Back arrow icon
import { getUserAvatar } from "../lib/avatars";

interface Member {
  id: string;
  name: string;
  avatar_url: string | null;
  isMod: boolean;
}

interface UserGroup {
  id: string;
  name: string;
  invite_code: string;
  role: string;
  created_by: string;
}

function GroupMembersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdFromUrl = searchParams.get('groupId'); // Get group ID from URL

  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [currentGroup, setCurrentGroup] = useState<UserGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [reportingIndex, setReportingIndex] = useState<number | null>(null);
  const [reportComment, setReportComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentGroup = async () => {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Error fetching user:", userError);
          router.push("/login");
          return;
        }
        setCurrentUser(user);

        // If no group ID in URL, redirect to home
        if (!groupIdFromUrl) {
          console.log("No group ID provided, redirecting to home");
          router.push("/home");
          return;
        }

        console.log("📍 Loading group from URL:", groupIdFromUrl);

        // Get user's membership in the specified group
        const { data: membership, error: memErr } = await supabase
          .from("group_members")
          .select("group_id, role")
          .eq("user_id", user.id)
          .eq("group_id", groupIdFromUrl)
          .single();

        if (memErr || !membership) {
          console.error("User not member of this group:", memErr);
          router.push("/home");
          return;
        }

        // Get the group details
        const { data: groupData, error: groupErr } = await supabase
          .from("groups")
          .select("id, name, invite_code, created_by")
          .eq("id", groupIdFromUrl)
          .single();

        if (groupErr || !groupData) {
          console.error("Error fetching group:", groupErr);
          router.push("/home");
          return;
        }

        const currentGroupData: UserGroup = {
          id: groupData.id,
          name: groupData.name,
          invite_code: groupData.invite_code,
          role: membership.role,
          created_by: groupData.created_by,
        };

        console.log("✅ Loaded group:", currentGroupData.name);
        setCurrentGroup(currentGroupData);

      } catch (error) {
        console.error("Error in fetchCurrentGroup:", error);
        router.push("/home");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentGroup();
  }, [router, groupIdFromUrl]);

  useEffect(() => {
    if (!currentGroup) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      console.log("👥 Fetching members for group:", currentGroup.name);

      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, role")
        .eq("group_id", currentGroup.id);

      if (membersError) {
        console.error("Failed to fetch group members:", membersError);
        return;
      }

      if (!membersData || membersData.length === 0) {
        setMembers([]);
        return;
      }

      const userIds = membersData.map((m) => m.user_id);

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Failed to fetch profiles:", profilesError);
        return;
      }

      const formatted = membersData.map((member) => {
        const profile = profilesData?.find((p) => p.id === member.user_id);
        const isCreator = profile?.id === currentGroup.created_by;
        return {
          id: profile?.id ?? "unknown",
          name: profile?.name ?? "Unknown",
          avatar_url: profile?.avatar_url ?? null,
          isMod: member.role === "mod" || isCreator,
        };
      });

      formatted.sort((a, b) => Number(b.isMod) - Number(a.isMod));
      console.log("✅ Loaded", formatted.length, "members");
      setMembers(formatted);
    };

    fetchMembers();
  }, [currentGroup]);

  const isModerator =
    currentGroup?.role === "mod" ||
    currentUser?.id === currentGroup?.created_by;

  const kickMember = async (memberId: string) => {
    if (!currentGroup) return;
    if (!confirm("Are you sure you want to kick this member?")) return;

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", currentGroup.id)
      .eq("user_id", memberId);

    if (error) {
      alert("Failed to kick member: " + error.message);
    } else {
      alert("Member kicked successfully.");
      const updated = members.filter((m) => m.id !== memberId);
      setMembers(updated);
    }
  };

  const handleReportSubmit = () => {
    if (reportingIndex === null) return;
    const reportedUser = members[reportingIndex];
    console.log("Reported:", reportedUser.name, "Comment:", reportComment);
    setReportingIndex(null);
    setReportComment("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF2CC] flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!currentUser || !currentGroup) {
    return (
      <div className="min-h-screen bg-[#FFF2CC] flex items-center justify-center">
        <div className="text-xl">Group not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF2CC] text-black p-4 flex flex-col items-center">
      <div className="w-full max-w-md relative">
        <button
          onClick={() => router.push("/home")}
          className="absolute left-0 top-0 mt-2 ml-2 p-2 rounded-full hover:bg-gray-200 transition"
          aria-label="Go back to home"
        >
          <IoArrowBack className="text-2xl" />
        </button>

        <h1 className="text-2xl font-black text-center mb-2">Group Members</h1>
        
        {/* Show current group name */}
        <h2 className="text-lg font-semibold text-center mb-6 text-gray-700">
          {currentGroup.name}
        </h2>

        <div className="flex flex-col gap-4">
          {members.map((user, i) => (
            <div
              key={user.id}
              className="relative bg-white rounded-xl shadow-md p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={getUserAvatar(user.id, user.avatar_url)}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-semibold">{user.name}</span>
                {user.isMod && (
                  <FaCrown className="text-yellow-500 text-xl ml-1" title="Moderator" />
                )}
              </div>

              <div className="flex items-center gap-2">
                {user.id !== currentUser.id && !user.isMod && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuIndex(openMenuIndex === i ? null : i)
                      }
                    >
                      <BsThreeDotsVertical className="text-xl" />
                    </button>

                    {openMenuIndex === i && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-10 w-40">
                        <button
                          onClick={() => {
                            setReportingIndex(i);
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

                {isModerator && user.id !== currentUser.id && !user.isMod && (
                  <button
                    onClick={() => kickMember(user.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-700"
                  >
                    Kick
                  </button>
                )}
              </div>

              {reportingIndex === i && (
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GroupMembersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF2CC] flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <GroupMembersContent />
    </Suspense>
  );
}