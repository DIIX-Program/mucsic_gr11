import { getConnection } from "../config/db.js";
import mssql from "mssql";

export const artistRepository = {
  createRequest: async (artist: {
    id: string;
    user_id: string;
    artist_name: string;
    bio?: string;
    avatar_url?: string;
    status: string;
  }) => {
    const pool = await getConnection();
    await pool
      .request()
      .input("id", mssql.VarChar, artist.id)
      .input("uid", mssql.VarChar, artist.user_id)
      .input("name", mssql.NVarChar, artist.artist_name)
      .input("bio", mssql.NVarChar, artist.bio || null)
      .input("av", mssql.VarChar, artist.avatar_url || null)
      .input("status", mssql.VarChar, artist.status)
      .query(`
        INSERT INTO artists (id, user_id, artist_name, bio, avatar_url, status)
        VALUES (@id, @uid, @name, @bio, @av, @status)
      `);
  },

  findById: async (id: string, currentUserId?: string) => {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("id", mssql.VarChar, id)
      .query(`
        SELECT a.*, u.username, u.display_name,
          (SELECT COUNT(*) FROM follows WHERE following_id = a.user_id) AS followers_count,
          (SELECT COUNT(*) FROM tracks t WHERE t.artist_id = a.id AND t.status = 'APPROVED') AS track_count
        FROM artists a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = @id
      `);
    
    const artist = result.recordset[0];
    if (!artist) return null;

    // Get tracks
    const tracksRes = await pool.request()
      .input("aid", mssql.VarChar, id)
      .query(`
        SELECT 
          t.id, t.title, t.main_artist, t.plays_count, t.likes_count, t.created_at,
          s_audio.path AS file_path,
          s_img.path AS cover_url
        FROM tracks t
        JOIN storage_objects s_audio ON t.audio_object_id = s_audio.id
        LEFT JOIN storage_objects s_img ON t.cover_image_object_id = s_img.id
        WHERE t.artist_id = @aid AND t.status = 'APPROVED'
        ORDER BY t.plays_count DESC
      `);

    // Get recent comments on those tracks
    const commentsRes = await pool.request()
      .input("aid", mssql.VarChar, id)
      .query(`
        SELECT TOP 10 c.*, u.username AS user_name, u.avatar_url AS user_avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN tracks t ON c.track_id = t.id
        WHERE t.artist_id = @aid AND c.status = 'APPROVED'
        ORDER BY c.created_at DESC
      `);

    return {
      ...artist,
      tracks: tracksRes.recordset,
      comments: commentsRes.recordset
    };
  },

  findByUserId: async (userId: string) => {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("uid", mssql.VarChar, userId)
      .query("SELECT * FROM artists WHERE user_id = @uid");
    return result.recordset[0];
  },

  findAllPending: async () => {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`
        SELECT a.*, u.username, u.email
        FROM artists a
        JOIN users u ON a.user_id = u.id
        WHERE a.status = 'PENDING'
        ORDER BY a.created_at DESC
      `);
    return result.recordset;
  },

  findAllApproved: async () => {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query("SELECT * FROM artists WHERE status = 'APPROVED' ORDER BY artist_name ASC");
    return result.recordset;
  },

  updateStatus: async (id: string, status: string, verified: boolean = false) => {
    const pool = await getConnection();
    const tx = new mssql.Transaction(pool);
    await tx.begin();
    try {
      // 1. Update artist status
      await new mssql.Request(tx)
        .input("id", mssql.VarChar, id)
        .input("status", mssql.VarChar, status)
        .input("verified", mssql.Bit, verified ? 1 : 0)
        .query("UPDATE artists SET status = @status, verified = @verified WHERE id = @id");

      // 2. If approved, add role_artist to user
      if (status === 'APPROVED') {
        const artist = await new mssql.Request(tx)
          .input("id", mssql.VarChar, id)
          .query("SELECT user_id FROM artists WHERE id = @id");
        
        const userId = artist.recordset[0]?.user_id;
        if (userId) {
          await new mssql.Request(tx)
            .input("uid", mssql.VarChar, userId)
            .input("rid", mssql.VarChar, "role_artist")
            .query(`
              IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = @uid AND role_id = @rid)
                INSERT INTO user_roles (user_id, role_id) VALUES (@uid, @rid)
            `);
        }
      }

      // 3. If demoted (rejected or explicitly demoted later), remove role_artist
      if (status === 'REJECTED' || status === 'DEMOTED') {
        const artist = await new mssql.Request(tx)
           .input("id", mssql.VarChar, id)
           .query("SELECT user_id FROM artists WHERE id = @id");
        
        const userId = artist.recordset[0]?.user_id;
        if (userId) {
          await new mssql.Request(tx)
            .input("uid", mssql.VarChar, userId)
            .input("rid", mssql.VarChar, "role_artist")
            .query("DELETE FROM user_roles WHERE user_id = @uid AND role_id = @rid");
        }
      }

      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  updateArtist: async (id: string, data: { artist_name?: string; bio?: string; avatar_url?: string; banner_url?: string }) => {
    const pool = await getConnection();
    await pool
      .request()
      .input("id", mssql.VarChar, id)
      .input("name", mssql.NVarChar, data.artist_name || null)
      .input("bio", mssql.NVarChar, data.bio || null)
      .input("av", mssql.VarChar, data.avatar_url || null)
      .input("bn", mssql.VarChar, data.banner_url || null)
      .query(`
        UPDATE artists
        SET
          artist_name = COALESCE(@name, artist_name),
          bio = COALESCE(@bio, bio),
          avatar_url = COALESCE(@av, avatar_url),
          banner_url = COALESCE(@bn, banner_url)
        WHERE id = @id
      `);
  }
};
