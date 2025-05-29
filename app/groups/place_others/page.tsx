"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "../../hooks/useUserData";
import { useGroupWorkflow } from "../../hooks/useGroupWorkflow";
import { useDailyAxis } from "../../hooks/useDailyAxis";
import { TokenGrid } from "../../components/TokenGrid";

// Constants for sizing
const AXIS_WIDTH = 300;
const AXIS_HEIGHT = 300;
const NEUTRAL_ZONE_HEIGHT = 100;

export default function PlaceOthers() {
  const router = useRouter();
  const {
    userName,
    firstName,
    userAvatar,
    loading: userLoading,
    error: userError,
  } = useUserData();
  const {
    loading,
    error: groupError,
    selectedGroup,
    tokens,
    getWorkflowGroup,
    handlePositionChange,
    saveOthersPlacement,
  } = useGroupWorkflow();

  const {
    dailyAxis,
    loading: axisLoading,
    error: axisError,
  } = useDailyAxis(selectedGroup?.id || null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allTokensPlaced, setAllTokensPlaced] = useState(false);

  // Get the workflow group on component mount
  useEffect(() => {
    getWorkflowGroup();
  }, []);

  // Handle next button
  const handleNext = async () => {
    if (!dailyAxis) {
      console.error("Daily axis is not available");
      return;
    }

    try {
      setIsSaving(true);
      console.log("🎯 Saving others placement with dailyAxis:", dailyAxis);
      await saveOthersPlacement(dailyAxis);
      router.push("/groups/results");
    } catch (err: any) {
      console.error("Error saving positions:", err);
      setError(err.message || "Failed to save positions");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || userLoading || axisLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="text-2xl">Loading...</div>
      </main>
    );
  }

  if (error || userError || axisError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FFF8E1]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
          {error || userError || axisError}
        </div>
        <button
          onClick={() => router.push("/groups/place_yourself")}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Start Over
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center pt-8 p-4 bg-[#FFF8E1]">
      <div className="w-full max-w-[430px] flex flex-col items-center">
        {process.env.NODE_ENV === 'development' && (
          <div className="w-full mb-4 p-2 bg-gray-100 rounded text-xs text-left break-all">
            <strong>DEBUG:</strong>
            <pre>{JSON.stringify({
              tokens,
              selectedGroup,
              dailyAxis
            }, null, 2)}</pre>
          </div>
        )}
        {/* Header with Place Others text */}
        <div className="bg-[#FFE082] py-4 px-4 rounded-full w-full mx-auto mb-8">
          <h1
            className="text-4xl font-black text-center"
            style={{
              textShadow:
                "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
              color: "white",
              fontFamily: "Arial, sans-serif",
            }}
          >
            PLACE OTHERS
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}

        {tokens.length === 0 ? (
          <div className="text-center">
            <p className="text-lg mb-6">
              You're the only member in this group right now.
            </p>
            <button
              onClick={() => router.push("/groups/results")}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg"
            >
              Skip to Results
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center w-full">
              <TokenGrid
                tokens={tokens}
                onPositionChange={handlePositionChange}
                onPlacementChange={setAllTokensPlaced}
                axisLabels={dailyAxis?.labels || {
                  top: "Wet Sock",
                  bottom: "Dry Tongue",
                  left: "Tree Hugger",
                  right: "Lumberjack",
                }}
                axisColors={dailyAxis?.labels.labelColors || {
                  top: "rgba(251, 207, 232, 0.95)", // Pink
                  bottom: "rgba(167, 243, 208, 0.95)", // Green
                  left: "rgba(221, 214, 254, 0.95)", // Purple
                  right: "rgba(253, 230, 138, 0.95)", // Yellow
                }}
                axisWidth={AXIS_WIDTH}
                axisHeight={AXIS_HEIGHT}
                neutralZoneHeight={NEUTRAL_ZONE_HEIGHT}
              />
            </div>

            {/* Next Button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={handleNext}
                disabled={isSaving || !allTokensPlaced}
                className="bg-[#60A5FA] py-3 px-10 rounded-full disabled:opacity-50"
              >
                <span
                  className="text-xl font-black"
                  style={{
                    textShadow:
                      "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                    color: "white",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {isSaving ? "Saving..." : "Next"}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
