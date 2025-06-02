// hooks/useComments.ts
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/auth/supabase'

interface Comment {
  id: string
  author: string
  author_avatar: string
  text: string
  created_at: string
  commenter_user_id: string
}

/**
 * useComments - Updated for Axis-based Comments
 * ==============================================
 * 
 * Now supports comments tied to specific axis placements:
 * - Comments are per person per axis (not just per person per group)
 * - Requires axis_id in addition to group_id and target_user_id
 * - view_type distinguishes between 'self' and 'guessed' placements
 */
export const useComments = (
  groupId: string | null, 
  targetUserId: string | null, 
  viewType: 'self' | 'guessed',
  axisId: string | null = null // NEW: axis_id parameter
) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch comments for specific axis placement
  const fetchComments = async () => {
    if (!groupId || !targetUserId || !axisId) {
      console.log('🔍 Missing required params for comments:', { groupId, targetUserId, axisId })
      setComments([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching comments for:', { groupId, targetUserId, viewType, axisId })

      // Step 1: Fetch comments for this specific axis placement
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('group_id', groupId)
        .eq('target_user_id', targetUserId)
        .eq('view_type', viewType)
        .eq('axis_id', axisId) // NEW: Filter by specific axis
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (commentsError) {
        console.error('❌ Error fetching comments:', commentsError)
        throw commentsError
      }

      console.log('📝 Raw comments from DB:', commentsData)

      if (!commentsData || commentsData.length === 0) {
        console.log('📭 No comments found for this axis placement')
        setComments([])
        return
      }

      // Step 2: Get unique commenter user IDs
      const commenterUserIds = [...new Set(commentsData.map(comment => comment.commenter_user_id))]
      console.log('👥 Fetching profiles for:', commenterUserIds)

      // Step 3: Fetch profiles for commenters
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', commenterUserIds)

      if (profilesError) {
        console.error('⚠️ Error fetching profiles:', profilesError)
        // Continue without profiles rather than failing completely
      }

      console.log('👤 Profiles data:', profilesData)

      // Step 4: Combine comments with profile info
      const formattedComments: Comment[] = commentsData.map(comment => {
        const profile = profilesData?.find(p => p.id === comment.commenter_user_id)
        return {
          id: comment.id,
          author: profile?.name || 'Unknown User',
          author_avatar: profile?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50)}`,
          text: comment.comment_text,
          created_at: comment.created_at,
          commenter_user_id: comment.commenter_user_id
        }
      })

      console.log('✅ Formatted comments:', formattedComments)
      setComments(formattedComments)

    } catch (err: any) {
      console.error('❌ Error in fetchComments:', err)
      setError(err.message || 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  // Fetch comments when dependencies change
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { groupId, targetUserId, viewType, axisId })
    fetchComments()
  }, [groupId, targetUserId, viewType, axisId])

  // Add comment for specific axis placement
  const addComment = async (commentText: string) => {
    if (!groupId || !targetUserId || !axisId || !commentText.trim()) {
      throw new Error('Missing required information')
    }

    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('💾 Saving comment to database:', {
        group_id: groupId,
        commenter_user_id: user.id,
        target_user_id: targetUserId,
        view_type: viewType,
        axis_id: axisId, // NEW: Include axis_id
        comment_text: commentText.trim()
      })

      // Insert the comment into database
      const { data, error } = await supabase
        .from('comments')
        .insert({
          group_id: groupId,
          commenter_user_id: user.id,
          target_user_id: targetUserId,
          view_type: viewType,
          axis_id: axisId, // NEW: Save axis_id with comment
          comment_text: commentText.trim(),
          is_deleted: false
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error saving comment:', error)
        throw error
      }

      console.log('✅ Comment saved successfully to database:', data)

      // Refresh comments to show the new one with proper author info
      await fetchComments()

      return data
    } catch (err: any) {
      console.error('❌ Error saving comment:', err)
      throw new Error(err.message || 'Failed to save comment')
    } finally {
      setLoading(false)
    }
  }

  // Delete comment (soft delete)
  const deleteComment = async (commentId: string) => {
    try {
      console.log('🗑️ Soft deleting comment:', commentId)
      
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId)

      if (error) {
        console.error('❌ Error deleting comment:', error)
        throw error
      }

      // Refresh comments to remove the deleted one
      await fetchComments()
    } catch (err: any) {
      console.error('❌ Error deleting comment:', err)
      throw new Error(err.message || 'Failed to delete comment')
    }
  }

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    refreshComments: fetchComments
  }
}