// hooks/useDailyAxis.js
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/auth/supabase'
import {
  getTwoDifferentAxisPairs,
  generateAxisLabels
} from '../data/axisPairs'

interface DailyAxis {
  id: string
  group_id: string
  vertical_axis_pair_id: string
  horizontal_axis_pair_id: string
  left_label: string
  right_label: string
  top_label: string
  bottom_label: string
  date_generated: string
  labels: {
    top: string
    bottom: string
    left: string
    right: string
    labelColors: {
      top: string
      bottom: string
      left: string
      right: string
    }
  }
}

/**
 * useDailyAxis
 * -------------
 * • Generates fresh, random axis pairs every time place_yourself is loaded
 * • Stores axis data in session storage for consistency across workflow pages
 * • Only saves to database when user actually places themselves (via saveSelfPlacement)
 * • Provides fresh experience on every new workflow start
 */
export const useDailyAxis = (groupId: string | null) => {
  const [dailyAxis, setDailyAxis] = useState<DailyAxis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) {
      setDailyAxis(null)
      setLoading(false)
      return
    }

    // Check if we're in a workflow session first, otherwise generate fresh
    loadOrGenerateAxis(groupId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  /**
   * Loads existing session axis or generates fresh ones
   */
  const loadOrGenerateAxis = async (grpId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Check if we have axes for this group in session storage
      const sessionKey = `currentAxis_${grpId}`
      const sessionAxisData = sessionStorage.getItem(sessionKey)
      
      if (sessionAxisData) {
        console.log('📋 Loading axes from session storage for group:', grpId)
        const parsedAxis = JSON.parse(sessionAxisData)
        setDailyAxis(parsedAxis)
        setLoading(false)
        return
      }

      // Generate fresh axes for new workflow session
      console.log('🎯 Generating fresh axes for new workflow session, group:', grpId)
      await generateFreshSessionAxis(grpId)

    } catch (err: any) {
      console.error('❌ Error loading/generating axes:', err)
      setError(err.message || 'Failed to load axes')
      setLoading(false)
    }
  }

  /**
   * Generates fresh axis pairs and stores them in session storage
   */
  const generateFreshSessionAxis = async (grpId: string) => {
    try {
      // 1️⃣ Fetch recently used pairs to avoid immediate repeats
      const { data: usedAxes, error: usedErr } = await supabase
        .from('axes')
        .select('vertical_axis_pair_id, horizontal_axis_pair_id')
        .eq('group_id', grpId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (usedErr) {
        console.error('Error fetching previously used axes:', usedErr)
      }

      const usedVerticalIds =
        usedAxes?.map(a => a.vertical_axis_pair_id).filter(Boolean) || []
      const usedHorizontalIds =
        usedAxes?.map(a => a.horizontal_axis_pair_id).filter(Boolean) || []
      const allUsedIds = [...usedVerticalIds, ...usedHorizontalIds]

      console.log('🚫 Recently used axis pairs:', allUsedIds)

      // 2️⃣ Generate fresh pairs
      const { vertical: verticalPair, horizontal: horizontalPair } =
        getTwoDifferentAxisPairs(allUsedIds)

      console.log('✨ Generated fresh vertical pair:', verticalPair.id, '-', verticalPair.left, 'vs', verticalPair.right)
      console.log('✨ Generated fresh horizontal pair:', horizontalPair.id, '-', horizontalPair.left, 'vs', horizontalPair.right)

      // 3️⃣ Combine labels
      const combinedLabels = combineLabels(verticalPair, horizontalPair)

      // 4️⃣ Create session axis object (no database save yet)
      const sessionAxis: DailyAxis = {
        id: `session_${Date.now()}`, // Temporary ID for session
        group_id: grpId,
        vertical_axis_pair_id: verticalPair.id,
        horizontal_axis_pair_id: horizontalPair.id,
        left_label: horizontalPair.left,
        right_label: horizontalPair.right,
        top_label: verticalPair.left,
        bottom_label: verticalPair.right,
        date_generated: new Date().toISOString(),
        labels: combinedLabels
      }

      // 5️⃣ Store in session storage for workflow consistency
      const sessionKey = `currentAxis_${grpId}`
      sessionStorage.setItem(sessionKey, JSON.stringify(sessionAxis))
      console.log('💾 Stored axes in session storage for workflow consistency')

      setDailyAxis(sessionAxis)

    } catch (err: any) {
      console.error('❌ Error generating session axes:', err)
      
      // Fallback to in-memory axes
      const { vertical, horizontal } = getTwoDifferentAxisPairs()
      const fallbackAxis: DailyAxis = {
        id: `fallback_${Date.now()}`,
        group_id: grpId,
        vertical_axis_pair_id: vertical.id,
        horizontal_axis_pair_id: horizontal.id,
        left_label: horizontal.left,
        right_label: horizontal.right,
        top_label: vertical.left,
        bottom_label: vertical.right,
        date_generated: new Date().toISOString(),
        labels: combineLabels(vertical, horizontal)
      }
      
      setDailyAxis(fallbackAxis)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Saves the current session axes to the database
   * Called by saveSelfPlacement when user actually places themselves
   */
  const saveAxisToDatabase = async (axis: DailyAxis) => {
    try {
      console.log('💾 Saving axes to database:', axis.id)
      
      const today = new Date().toISOString().split('T')[0]
      
      // Check if axes already exist for this group today
      const { data: existingAxis, error: checkError } = await supabase
        .from('axes')
        .select('id')
        .eq('group_id', axis.group_id)
        .eq('date_generated', today)
        .eq('is_active', true)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing axes:', checkError)
        throw checkError
      }

      if (existingAxis) {
        console.log('📋 Axes already exist for today, updating session axis with DB id')
        // Update session axis with database ID
        const updatedAxis = { ...axis, id: existingAxis.id }
        const sessionKey = `currentAxis_${axis.group_id}`
        sessionStorage.setItem(sessionKey, JSON.stringify(updatedAxis))
        return existingAxis.id
      }

      // Insert new axes
      const { data: inserted, error: insertErr } = await supabase
        .from('axes')
        .insert({
          group_id: axis.group_id,
          vertical_axis_pair_id: axis.vertical_axis_pair_id,
          horizontal_axis_pair_id: axis.horizontal_axis_pair_id,
          left_label: axis.left_label,
          right_label: axis.right_label,
          top_label: axis.top_label,
          bottom_label: axis.bottom_label,
          date_generated: today,
          is_active: true
        })
        .select('id')
        .single()

      if (insertErr) {
        console.error('Error inserting axes:', insertErr)
        throw insertErr
      }

      console.log('✅ Successfully saved axes to database with ID:', inserted.id)
      
      // Update session with database ID
      const updatedAxis = { ...axis, id: inserted.id }
      const sessionKey = `currentAxis_${axis.group_id}`
      sessionStorage.setItem(sessionKey, JSON.stringify(updatedAxis))
      
      return inserted.id

    } catch (err: any) {
      console.error('❌ Error saving axes to database:', err)
      throw err
    }
  }

  /** Helper to merge label info */
  const combineLabels = (verticalPair: any, horizontalPair: any) => {
    const v = generateAxisLabels(verticalPair)
    const h = generateAxisLabels(horizontalPair)

    return {
      top: v.left || verticalPair.left,
      bottom: v.right || verticalPair.right,
      left: h.left || horizontalPair.left,
      right: h.right || horizontalPair.right,
      labelColors: {
        top: v.labelColors?.left || v.labelColors?.top || '#000',
        bottom: v.labelColors?.right || v.labelColors?.bottom || '#000',
        left: h.labelColors?.left || '#000',
        right: h.labelColors?.right || '#000'
      }
    }
  }

  /** Force-refresh helper - clears session and generates new axes */
  const refreshAxis = () => {
    if (groupId) {
      console.log('🔄 Refreshing axes - clearing session storage')
      const sessionKey = `currentAxis_${groupId}`
      sessionStorage.removeItem(sessionKey)
      generateFreshSessionAxis(groupId)
    }
  }

  /** Clear session data for this group */
  const clearSessionAxis = (grpId: string) => {
    const sessionKey = `currentAxis_${grpId}`
    sessionStorage.removeItem(sessionKey)
  }

  return {
    dailyAxis,
    loading,
    error,
    refreshAxis,
    saveAxisToDatabase,
    clearSessionAxis
  }
}