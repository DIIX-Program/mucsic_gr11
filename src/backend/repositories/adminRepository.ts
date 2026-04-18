import { getConnection } from "../config/db.js";
import mssql from 'mssql';

export const adminRepository = {
  // ── Tracks ──────────────────────────────────────────────────────────────────
  getPendingTracks: async (limit = 10, offset = 0) => {
    const pool = await getConnection();
    const r = await pool.request()
      .input('limit', mssql.Int, limit)
      .input('offset', mssql.Int, offset)
      .query(`
        SELECT
          t.id, t.title, t.main_artist, t.status, t.created_at, t.visibility,
          u.username AS uploader_name,
          s_audio.path AS audio_path,
          s_cover.path AS cover_path
        FROM tracks t
        JOIN users u ON t.uploader_user_id = u.id
        LEFT JOIN storage_objects s_audio ON t.audio_object_id = s_audio.id
        LEFT JOIN storage_objects s_cover ON t.cover_image_object_id = s_cover.id
        WHERE t.status = 'PENDING'
        ORDER BY t.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    return r.recordset;
  },

  getRejectedTracks: async (limit = 10, offset = 0) => {
    const pool = await getConnection();
    const r = await pool.request()
      .input('limit', mssql.Int, limit)
      .input('offset', mssql.Int, offset)
      .query(`
        SELECT t.id, t.title, t.main_artist, t.status, t.created_at,
               u.username AS uploader_name
        FROM tracks t
        JOIN users u ON t.uploader_user_id = u.id
        WHERE t.status = 'REJECTED'
        ORDER BY t.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    return r.recordset;
  },

  /**
   * Fix BUG #2: each query uses a NEW Request instance
   */
  updateTrackStatus: async (trackId: string, status: 'APPROVED' | 'REJECTED') => {
    const pool = await getConnection();
    const tx = new mssql.Transaction(pool);
    await tx.begin();
    try {
      await new mssql.Request(tx)
        .input('id', mssql.VarChar, trackId)
        .input('status', mssql.VarChar, status)
        .query("UPDATE tracks SET status = @status WHERE id = @id");

      const storageStatus = status === 'APPROVED' ? 'active' : 'inactive';
      await new mssql.Request(tx)
        .input('id', mssql.VarChar, trackId)
        .input('sStatus', mssql.VarChar, storageStatus)
        .query(`
          UPDATE storage_objects SET status = @sStatus
          WHERE id IN (
            SELECT audio_object_id FROM tracks WHERE id = @id
            UNION
            SELECT cover_image_object_id FROM tracks WHERE id = @id
          )
        `);
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  // ── Comments ─────────────────────────────────────────────────────────────────
  /**
   * getRecentComments - Fetches all recent comments for moderation.
   */
  getRecentComments: async (limit: number = 20, offset: number = 0): Promise<any[]> => {
    const pool = await getConnection();
    const result = await pool.request()
      .input('limit', mssql.Int, limit)
      .input('offset', mssql.Int, offset)
      .query(`
        SELECT 
          c.id, c.content, c.status, c.created_at,
          u.username, u.avatar_url,
          t.title AS track_title
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN tracks t ON c.track_id = t.id
        ORDER BY c.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    return result.recordset;
  },

  /**
   * updateCommentStatus - Approves or hides a comment.
   */
  updateCommentStatus: async (id: string, status: 'APPROVED' | 'HIDDEN' | 'REJECTED'): Promise<void> => {
    const pool = await getConnection();
    await pool.request()
      .input('id', mssql.UniqueIdentifier, id)
      .input('status', mssql.NVarChar, status)
      .query('UPDATE comments SET status = @status WHERE id = @id');
  },

  deleteComment: async (commentId: string) => {
    const pool = await getConnection();
    await pool.request()
      .input('id', mssql.VarChar, commentId)
      .query("DELETE FROM comments WHERE id = @id");
  },

  // ── Users ─────────────────────────────────────────────────────────────────────
  getUsers: async (limit = 50, offset = 0, search?: string) => {
    const pool = await getConnection();
    const term = search ? `%${search}%` : null;
    const r = await pool.request()
      .input('limit', mssql.Int, limit)
      .input('offset', mssql.Int, offset)
      .input('term', mssql.NVarChar, term)
      .query(`
        SELECT
          u.id, u.username, u.email, u.display_name, u.avatar_url,
          u.status, u.created_at, u.followers_count,
          (SELECT COUNT(*) FROM tracks t WHERE t.uploader_user_id = u.id) AS total_tracks,
          (SELECT COUNT(*) FROM playlists p WHERE p.user_id = u.id) AS total_playlists,
          CASE WHEN EXISTS (
            SELECT 1 FROM user_roles ur JOIN app_roles ar ON ur.role_id = ar.id
            WHERE ur.user_id = u.id AND ar.name = 'ADMIN'
          ) THEN 1 ELSE 0 END AS is_admin
        FROM users u
        WHERE (@term IS NULL OR u.username LIKE @term OR u.email LIKE @term OR u.display_name LIKE @term)
        ORDER BY u.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    return r.recordset;
  },

  setUserStatus: async (userId: string, status: 'active' | 'disabled') => {
    const pool = await getConnection();
    await pool.request()
      .input('id', mssql.VarChar, userId)
      .input('status', mssql.VarChar, status)
      .query("UPDATE users SET status = @status WHERE id = @id");
  },

  deleteUser: async (userId: string) => {
    const pool = await getConnection();
    const tx = new mssql.Transaction(pool);
    await tx.begin();
    try {
      // Delete in dependency order
      await new mssql.Request(tx).input('id', mssql.VarChar, userId).query("DELETE FROM follows WHERE follower_id = @id OR following_id = @id");
      await new mssql.Request(tx).input('id', mssql.VarChar, userId).query("DELETE FROM track_likes WHERE user_id = @id");
      await new mssql.Request(tx).input('id', mssql.VarChar, userId).query("DELETE FROM listening_history WHERE user_id = @id");
      await new mssql.Request(tx).input('id', mssql.VarChar, userId).query("DELETE FROM comments WHERE user_id = @id");
      await new mssql.Request(tx).input('id', mssql.VarChar, userId).query("DELETE FROM user_roles WHERE user_id = @id");
      await new mssql.Request(tx).input('id', mssql.VarChar, userId).query("DELETE FROM playlists WHERE user_id = @id");
      await new mssql.Request(tx).input('id', mssql.VarChar, userId).query("DELETE FROM users WHERE id = @id");
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  // ── Dashboard Stats ───────────────────────────────────────────────────────────
  getStats: async () => {
    const pool = await getConnection();
    const r = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM users)                           AS total_users,
        (SELECT COUNT(*) FROM tracks)                         AS total_tracks,
        (SELECT COUNT(*) FROM tracks WHERE status='PENDING')  AS pending_tracks,
        (SELECT COUNT(*) FROM tracks WHERE status='APPROVED') AS approved_tracks,
        (SELECT COUNT(*) FROM playlists)                      AS total_playlists,
        (SELECT COUNT(*) FROM comments)                       AS total_comments,
        (SELECT ISNULL(SUM(plays_count),0) FROM tracks)       AS total_plays
    `);
    return r.recordset[0];
  }
};
