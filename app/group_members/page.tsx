'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCrown } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/auth/supabase";
import { IoArrowBack } from "react-icons/io5"; // Back arrow icon

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

export default function GroupMembersPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [reportingIndex, setReportingIndex] = useState<number | null>(null);
  const [reportComment, setReportComment] = useState("");

  useEffect(() => {
    const fetchUserAndGroups = async () => {
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

      const { data: memberships, error: memErr } = await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", user.id);

      if (memErr) {
        console.error("Error fetching memberships:", memErr);
        return;
      }

      if (!memberships || memberships.length === 0) {
        setUserGroups([]);
        return;
      }

      const groupIds = memberships.map((m) => m.group_id);

      const { data: groupsData, error: groupErr } = await supabase
        .from("groups")
        .select("id, name, invite_code, created_by")
        .in("id", groupIds);

      if (groupErr) {
        console.error("Error fetching groups:", groupErr);
        return;
      }

      const formattedGroups: UserGroup[] = groupsData.map((group) => {
        const membership = memberships.find((m) => m.group_id === group.id);
        return {
          id: group.id,
          name: group.name,
          invite_code: group.invite_code,
          role: membership?.role ?? "member",
          created_by: group.created_by,
        };
      });

      setUserGroups(formattedGroups);

      if (formattedGroups.length > 0) {
        setActiveGroup(formattedGroups[0].id);
      }
    };

    fetchUserAndGroups();
  }, [router]);

  useEffect(() => {
    if (!activeGroup) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, role")
        .eq("group_id", activeGroup);

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
        const isCreator = profile?.id === activeUserGroup?.created_by;
        return {
          id: profile?.id ?? "unknown",
          name: profile?.name ?? "Unknown",
          avatar_url: profile?.avatar_url ?? null,
          isMod: member.role === "mod" || isCreator,
        };
      });

      formatted.sort((a, b) => Number(b.isMod) - Number(a.isMod));
      setMembers(formatted);
    };

    fetchMembers();
  }, [activeGroup]);

  const activeUserGroup = activeGroup
    ? userGroups.find((g) => g.id === activeGroup)
    : null;
  const isModerator =
    activeUserGroup?.role === "mod" ||
    currentUser?.id === activeUserGroup?.created_by;

  const kickMember = async (memberId: string) => {
    if (!activeGroup) return;
    if (!confirm("Are you sure you want to kick this member?")) return;

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", activeGroup)
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

  if (!currentUser) {
    return <div>Loading user...</div>;
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

        <h1 className="text-2xl font-black text-center mb-6">Group Members</h1>

        {userGroups.length === 0 && <p>You are not in any groups.</p>}

        {userGroups.length > 1 && (
          <select
            value={activeGroup ?? ""}
            onChange={(e) => setActiveGroup(e.target.value)}
            className="mb-4 w-full p-2 rounded border border-gray-300"
          >
            {userGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex flex-col gap-4">
          {members.map((user, i) => (
            <div
              key={user.id}
              className="relative bg-white rounded-xl shadow-md p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
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