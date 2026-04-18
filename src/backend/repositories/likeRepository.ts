import { getConnection } from "../config/db.js";
import mssql from 'mssql';

/**
 * Like Repository - SQL Server Implementation
 * Fix BUG #5: likeTrack and unlikeTrack now update tracks.likes_count atomically.
 */
export const likeRepository = {
  /**
   * Add a track to a user's liked tracks + update likes_count
   */
  likeTrack: async (user_id: string, track_id: string): Promise<void> => {
    const pool = await getConnection();
    const tx = new mssql.Transaction(pool);
    await tx.begin();
    try {
      await new mssql.Request(tx)
        .input('userId',  mssql.VarChar, user_id)
        .input('trackId', mssql.VarChar, track_id)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM track_likes WHERE user_id = @userId AND track_id = @trackId)
          BEGIN
            INSERT INTO track_likes (user_id, track_id) VALUES (@userId, @trackId);
            UPDATE tracks SET likes_count = likes_count + 1 WHERE id = @trackId;
          END
        `);
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  /**
   * Remove a track from user's liked tracks + update likes_count
   */
  unlikeTrack: async (user_id: string, track_id: string): Promise<void> => {
    const pool = await getConnection();
    const tx = new mssql.Transaction(pool);
    await tx.begin();
    try {
      await new mssql.Request(tx)
        .input('userId',  mssql.VarChar, user_id)
        .input('trackId', mssql.VarChar, track_id)
        .query(`
          IF EXISTS (SELECT 1 FROM track_likes WHERE user_id = @userId AND track_id = @trackId)
          BEGIN
            DELETE FROM track_likes WHERE user_id = @userId AND track_id = @trackId;
            UPDATE tracks SET likes_count = CASE WHEN likes_count > 0 THEN likes_count - 1 ELSE 0 END WHERE id = @trackId;
          END
        `);
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  /**
   * Check if a user has liked a track
   */
  hasLiked: async (user_id: string, track_id: string): Promise<boolean> => {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId',  mssql.VarChar, user_id)
      .input('trackId', mssql.VarChar, track_id)
      .query("SELECT 1 FROM track_likes WHERE user_id = @userId AND track_id = @trackId");
    return result.recordset.length > 0;
  },

  /**
   * Get all track IDs a user has liked
   */
  getUserLikedTrackIds: async (user_id: string): Promise<string[]> => {
    const pool = await getConnection();
    const results = await pool.request()
      .input('userId', mssql.VarChar, user_id)
      .query("SELECT track_id FROM track_likes WHERE user_id = @userId");
    return results.recordset.map(r => r.track_id);
  }
};
