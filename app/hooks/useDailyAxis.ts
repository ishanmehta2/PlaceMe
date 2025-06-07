// hooks/useDailyAxis.ts
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
  is_active: boolean
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
 * useDailyAxis - Updated for Production Workflow
 * =============================================
 * 
 * NEW BEHAVIOR (Production-ready):
 * • Checks for existing active axes for today for the given group
 * • If found, loads and uses them (consistent experience for all group members)
 * • If not found, generates new axes and saves them immediately to database
 * • All users in the same group will see the same axes for the same day
 * • Uses is_active flag to manage which axes are current
 * 
 * This ensures the "once per day per group" requirement is met
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

    loadTodaysAxis(groupId)
  }, [groupId])

  /**
   * Main function: Load today's axes or generate new ones
   */
  const loadTodaysAxis = async (grpId: string) => {
    try {
      setLoading(true)
      setError(null)
  
      // FIXED: Check if we're targeting a specific axis but don't clear it yet
      const targetAxisId = sessionStorage.getItem('targetAxisId')
      
      if (targetAxisId) {
        console.log('🎯 Loading specific target axis:', targetAxisId)
        
        // Load the specific axis
        const { data: targetAxis, error: targetError } = await supabase
          .from('axes')
          .select('*')
          .eq('id', targetAxisId)
          .eq('group_id', grpId)
          .single()
  
        if (targetError) {
          console.error('❌ Error loading target axis:', targetError)
          // Clear the target and fall back to normal logic
          sessionStorage.removeItem('targetAxisId')
        } else {
          console.log('✅ Successfully loaded target axis:', targetAxis.id)
          const processedAxis = processAxisFromDatabase(targetAxis)
          setDailyAxis(processedAxis)
          setLoading(false)
          // FIXED: Don't clear targetAxisId here - let the workflow manage it
          return
        }
      }

      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

      console.log('🎯 Loading daily axes for group:', grpId, 'date:', today)

      // STEP 1: Check if axes already exist for this group today
      const { data: existingAxis, error: existingError } = await supabase
        .from('axes')
        .select('*')
        .eq('group_id', grpId)
        .eq('date_generated', today)
        .eq('is_active', true)
        .maybeSingle() // Use maybeSingle to avoid error when no rows found

      if (existingError) {
        console.error('❌ Error checking existing axes:', existingError)
        throw existingError
      }

      // STEP 2: If axes exist for today, use them
      if (existingAxis) {
        console.log('📋 Found existing axes for today:', existingAxis.id)
        const processedAxis = processAxisFromDatabase(existingAxis)
        setDailyAxis(processedAxis)
        setLoading(false)
        return
      }

      // STEP 3: No axes for today - generate new ones
      console.log('✨ No axes found for today, generating new ones...')
      await generateAndSaveTodaysAxis(grpId, today)

    } catch (err: any) {
      console.error('❌ Error in loadTodaysAxis:', err)
      setError(err.message || 'Failed to load daily axes')
      setLoading(false)
    }
  }

  /**
   * Generate new axes for today and save them immediately to database
   */
  const generateAndSaveTodaysAxis = async (grpId: string, today: string) => {
    try {
      // STEP 1: Get recently used axes to avoid immediate repeats
      const { data: recentAxes, error: recentError } = await supabase
        .from('axes')
        .select('vertical_axis_pair_id, horizontal_axis_pair_id')
        .eq('group_id', grpId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentError) {
        console.warn('⚠️ Could not fetch recent axes (continuing anyway):', recentError)
      }

      // Collect recently used axis pair IDs to avoid repeats
      const recentlyUsedIds: string[] = []
      if (recentAxes) {
        recentAxes.forEach(axis => {
          if (axis.vertical_axis_pair_id) recentlyUsedIds.push(axis.vertical_axis_pair_id)
          if (axis.horizontal_axis_pair_id) recentlyUsedIds.push(axis.horizontal_axis_pair_id)
        })
      }

      console.log('🚫 Avoiding recently used axis pairs:', recentlyUsedIds)

      // STEP 2: Generate fresh axis pairs
      const { vertical: verticalPair, horizontal: horizontalPair } = 
        getTwoDifferentAxisPairs(recentlyUsedIds)

      console.log('✨ Generated vertical pair:', verticalPair.id, '-', verticalPair.left, 'vs', verticalPair.right)
      console.log('✨ Generated horizontal pair:', horizontalPair.id, '-', horizontalPair.left, 'vs', horizontalPair.right)

      // STEP 3: Combine labels and colors
      const combinedLabels = combineAxisLabels(verticalPair, horizontalPair)

      // STEP 4: Deactivate any old axes for this group (cleanup)
      const { error: deactivateError } = await supabase
        .from('axes')
        .update({ is_active: false })
        .eq('group_id', grpId)
        .eq('is_active', true)

      if (deactivateError) {
        console.warn('⚠️ Could not deactivate old axes (continuing anyway):', deactivateError)
      }

      // STEP 5: Insert new axes into database
      const { data: newAxis, error: insertError } = await supabase
        .from('axes')
        .insert({
          group_id: grpId,
          vertical_axis_pair_id: verticalPair.id,
          horizontal_axis_pair_id: horizontalPair.id,
          left_label: horizontalPair.left,
          right_label: horizontalPair.right,
          top_label: verticalPair.left,
          bottom_label: verticalPair.right,
          date_generated: today,
          is_active: true
        })
        .select('*')
        .single()

      if (insertError) {
        console.error('❌ Error saving new axes to database:', insertError)
        throw insertError
      }

      console.log('✅ Successfully created and saved new daily axes:', newAxis.id)

      // STEP 6: Process and set the new axes
      const processedAxis = processAxisFromDatabase(newAxis)
      setDailyAxis(processedAxis)

    } catch (err: any) {
      console.error('❌ Error generating and saving axes:', err)
      
      // FALLBACK: Try to save a simple axis to database instead of using in-memory fallback
      console.log('🔄 Attempting fallback database save...')
      try {
        const { vertical, horizontal } = getTwoDifferentAxisPairs()
        
        // Try a simpler insert without complex constraints
        const { data: fallbackAxis, error: fallbackError } = await supabase
          .from('axes')
          .insert({
            group_id: grpId,
            vertical_axis_pair_id: vertical.id,
            horizontal_axis_pair_id: horizontal.id,
            left_label: horizontal.left,
            right_label: horizontal.right,
            top_label: vertical.left,
            bottom_label: vertical.right,
            date_generated: today,
            is_active: true
          })
          .select('*')
          .single()

        if (fallbackError) {
          console.error('❌ Fallback database save also failed:', fallbackError)
          throw new Error('Database is unavailable. Please try again later.')
        }

        console.log('✅ Fallback database save succeeded:', fallbackAxis.id)
        const processedAxis = processAxisFromDatabase(fallbackAxis)
        setDailyAxis(processedAxis)
      } catch (fallbackErr: any) {
        console.error('❌ All database operations failed:', fallbackErr)
        throw new Error('Unable to create or load axes. Please check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Convert database axis record to our DailyAxis interface
   */
  const processAxisFromDatabase = (axisRecord: any): DailyAxis => {
    // We need to reconstruct the axis pairs from the stored IDs to get colors
    // For now, we'll use the stored labels and default colors
    // You could enhance this by storing colors in the database too
    
    return {
      id: axisRecord.id,
      group_id: axisRecord.group_id,
      vertical_axis_pair_id: axisRecord.vertical_axis_pair_id,
      horizontal_axis_pair_id: axisRecord.horizontal_axis_pair_id,
      left_label: axisRecord.left_label,
      right_label: axisRecord.right_label,
      top_label: axisRecord.top_label,
      bottom_label: axisRecord.bottom_label,
      date_generated: axisRecord.date_generated,
      is_active: axisRecord.is_active,
      labels: {
        top: axisRecord.top_label,
        bottom: axisRecord.bottom_label,
        left: axisRecord.left_label,
        right: axisRecord.right_label,
        labelColors: {
          // Default colors - you could store these in database or reconstruct from axis pairs
          top: 'rgba(251, 207, 232, 0.95)', // Pink
          bottom: 'rgba(167, 243, 208, 0.95)', // Green
          left: 'rgba(221, 214, 254, 0.95)', // Purple
          right: 'rgba(253, 230, 138, 0.95)' // Yellow
        }
      }
    }
  }

  /**
   * Helper to combine labels from vertical and horizontal axis pairs
   */
  const combineAxisLabels = (verticalPair: any, horizontalPair: any) => {
    const v = generateAxisLabels(verticalPair)
    const h = generateAxisLabels(horizontalPair)

    return {
      top: v.left || verticalPair.left,
      bottom: v.right || verticalPair.right,
      left: h.left || horizontalPair.left,
      right: h.right || horizontalPair.right,
      labelColors: {
        top: v.labelColors?.left || v.labelColors?.top || 'rgba(251, 207, 232, 0.95)',
        bottom: v.labelColors?.right || v.labelColors?.bottom || 'rgba(167, 243, 208, 0.95)',
        left: h.labelColors?.left || 'rgba(221, 214, 254, 0.95)',
        right: h.labelColors?.right || 'rgba(253, 230, 138, 0.95)'
      }
    }
  }

  /**
   * Force refresh - deactivate current axes and generate new ones
   * Useful for testing or if you want to generate new axes manually
   */
  const forceRefreshAxis = async () => {
    if (!groupId) return
    
    try {
      setLoading(true)
      console.log('🔄 Force refreshing axes for group:', groupId)
      
      // Deactivate current axes
      const { error: deactivateError } = await supabase
        .from('axes')
        .update({ is_active: false })
        .eq('group_id', groupId)
        .eq('is_active', true)

      if (deactivateError) {
        console.error('Error deactivating axes:', deactivateError)
      }

      // Generate new axes
      const today = new Date().toISOString().split('T')[0]
      await generateAndSaveTodaysAxis(groupId, today)
      
    } catch (err: any) {
      console.error('Error force refreshing axes:', err)
      setError(err.message || 'Failed to refresh axes')
      setLoading(false)
    }
  }

  return {
    dailyAxis,
    loading,
    error,
    forceRefreshAxis // Replaces refreshAxis for testing purposes
  }
}