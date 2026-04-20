import { getConnection } from "../config/db.js";
import mssql from "mssql";

export const userRepository = {
  // ──────────────────────────────────────────
  // PROFILE
  // ──────────────────────────────────────────
  findProfileById: async (id: string, currentUserId?: string) => {
    const pool = await getConnection();

    const userRes = await pool
      .request()
      .input("id", mssql.VarChar, id)
      .query(`
        SELECT
          u.id, u.username, u.display_name, u.bio, u.avatar_url, u.banner_url,
          u.followers_count, u.following_count,
          (SELECT COUNT(*) FROM tracks t WHERE t.uploader_user_id = u.id AND t.status = 'APPROVED') AS total_tracks,
          (SELECT COUNT(*) FROM playlists p WHERE p.user_id = u.id) AS total_playlists
        FROM users u
        WHERE u.id = @id
      `);

    const user = userRes.recordset[0];
    if (!user) return null;

    let isFollowing = false;
    if (currentUserId && currentUserId !== id) {
      const followRes = await pool
        .request()
        .input("f1", mssql.VarChar, currentUserId)
        .input("f2", mssql.VarChar, id)
        .query("SELECT 1 FROM follows WHERE follower_id = @f1 AND following_id = @f2");
      isFollowing = followRes.recordset.length > 0;
    }

    return { ...user, isFollowing };
  },

  findTracksByUser: async (userId: string) => {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("uid", mssql.VarChar, userId)
      .query(`
        SELECT
          t.id, t.title, t.main_artist, t.plays_count, t.likes_count, t.created_at,
          s_audio.path AS file_path,
          s_img.path   AS cover_url
        FROM tracks t
        JOIN storage_objects s_audio ON s_audio.id = t.audio_object_id
        LEFT JOIN storage_objects s_img ON s_img.id = t.cover_image_object_id
        WHERE t.uploader_user_id = @uid AND t.status = 'APPROVED'
        ORDER BY t.created_at DESC
      `);
    return result.recordset;
  },

  // ──────────────────────────────────────────
  // PLAYLISTS (của chính user đang đăng nhập)
  // ──────────────────────────────────────────
  findPlaylistsByUser: async (userId: string) => {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("uid", mssql.VarChar, userId)
      .query(`
        SELECT
          p.id, p.name, p.cover_url, p.visibility, p.created_at,
          (SELECT COUNT(*) FROM playlist_tracks pt WHERE pt.playlist_id = p.id) AS track_count
        FROM playlists p
        WHERE p.user_id = @uid
        ORDER BY p.created_at DESC
      `);
    return result.recordset;
  },

  // ──────────────────────────────────────────
  // LIKED TRACKS
  // ──────────────────────────────────────────
  findLikedTracks: async (userId: string) => {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("uid", mssql.VarChar, userId)
      .query(`
        SELECT
          t.id, t.title, t.main_artist, t.plays_count, t.likes_count,
          s_audio.path AS file_path,
          s_img.path   AS cover_url,
          tl.created_at AS liked_at
        FROM track_likes tl
        JOIN tracks t          ON t.id = tl.track_id
        JOIN storage_objects s_audio ON s_audio.id = t.audio_object_id
        LEFT JOIN storage_objects s_img ON s_img.id = t.cover_image_object_id
        WHERE tl.user_id = @uid
          AND t.status = 'APPROVED'
        ORDER BY tl.created_at DESC
      `);
    return result.recordset;
  },

  // ──────────────────────────────────────────
  // LISTENING HISTORY
  // ──────────────────────────────────────────
  findHistory: async (userId: string, limit: number = 50) => {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("uid", mssql.VarChar, userId)
      .input("lim", mssql.Int, limit)
      .query(`
        SELECT TOP (@lim)
          t.id, t.title, t.main_artist, t.plays_count,
          s_audio.path AS file_path,
          s_img.path   AS cover_url,
          lh.played_at AS played_at
        FROM listening_history lh
        JOIN tracks t          ON t.id = lh.track_id
        JOIN storage_objects s_audio ON s_audio.id = t.audio_object_id
        LEFT JOIN storage_objects s_img ON s_img.id = t.cover_image_object_id
        WHERE lh.user_id = @uid
          AND t.status = 'APPROVED'
        ORDER BY lh.played_at DESC
      `);
    return result.recordset;
  },

  /**
   * findLibrary - Aggregates Playlists, Liked Tracks and History in ONE roundtrip.
   * Standardized preparation for production-grade library synchronization.
   */
  findLibrary: async (userId: string) => {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("userId", mssql.VarChar, userId)
      .query(`
        -- 1. Playlists
        SELECT
          p.id, p.name, p.cover_url, p.visibility, p.created_at,
          (SELECT COUNT(*) FROM playlist_tracks pt WHERE pt.playlist_id = p.id) AS track_count
        FROM playlists p
        WHERE p.user_id = @userId
        ORDER BY p.created_at DESC;

        -- 2. Liked Tracks
        SELECT
          t.id, t.title, t.main_artist, t.plays_count, t.likes_count,
          s_audio.path AS file_path,
          s_img.path   AS cover_url,
          tl.created_at AS liked_at
        FROM track_likes tl
        JOIN tracks t          ON t.id = tl.track_id
        JOIN storage_objects s_audio ON s_audio.id = t.audio_object_id
        LEFT JOIN storage_objects s_img ON s_img.id = t.cover_image_object_id
        WHERE tl.user_id = @userId
          AND t.status = 'APPROVED'
        ORDER BY tl.created_at DESC;

        -- 3. History
        SELECT TOP 50
          t.id, t.title, t.main_artist, t.plays_count,
          s_audio.path AS file_path,
          s_img.path   AS cover_url,
          lh.played_at AS played_at
        FROM listening_history lh
        JOIN tracks t          ON t.id = lh.track_id
        JOIN storage_objects s_audio ON s_audio.id = t.audio_object_id
        LEFT JOIN storage_objects s_img ON s_img.id = t.cover_image_object_id
        WHERE lh.user_id = @userId
          AND t.status = 'APPROVED'
        ORDER BY lh.played_at DESC;
      `);

    return {
      playlists: result.recordsets[0],
      likedTracks: result.recordsets[1],
      history: result.recordsets[2]
    };
  },

  // ──────────────────────────────────────────
  // UPDATE PROFILE
  // ──────────────────────────────────────────
  updateProfile: async (
    userId: string,
    data: { display_name?: string; bio?: string; avatar_url?: string }
  ) => {
    const pool = await getConnection();
    await pool
      .request()
      .input("id", mssql.VarChar, userId)
      .input("dn", mssql.NVarChar, data.display_name ?? null)
      .input("bio", mssql.NVarChar, data.bio ?? null)
      .input("av", mssql.VarChar, data.avatar_url ?? null)
      .query(`
        UPDATE users
        SET
          display_name = COALESCE(@dn, display_name),
          bio          = COALESCE(@bio, bio),
          avatar_url   = COALESCE(@av, avatar_url)
        WHERE id = @id
      `);
  },

  // ──────────────────────────────────────────
  // IS ARTIST
  // ──────────────────────────────────────────
  isArtist: async (userId: string): Promise<boolean> => {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("userId", mssql.VarChar, userId)
        .query(`
          SELECT 1 FROM user_roles ur
          JOIN app_roles ar ON ur.role_id = ar.id
          WHERE ur.user_id = @userId AND ar.name = 'ARTIST'
        `);
      return result.recordset.length > 0;
    } catch {
      return false;
    }
  },

  // ──────────────────────────────────────────
  // IS ADMIN
  // ──────────────────────────────────────────
  isAdmin: async (userId: string): Promise<boolean> => {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("userId", mssql.VarChar, userId)
        .query(`
          SELECT 1 FROM user_roles ur
          JOIN app_roles ar ON ur.role_id = ar.id
          WHERE ur.user_id = @userId AND ar.name = 'ADMIN'
        `);
      return result.recordset.length > 0;
    } catch {
      return false;
    }
  },

  // ──────────────────────────────────────────
  // FOLLOW / UNFOLLOW
  // ──────────────────────────────────────────
  follow: async (followerId: string, followingId: string): Promise<void> => {
    const pool = await getConnection();
    const tx = new mssql.Transaction(pool);
    await tx.begin();
    try {
      await new mssql.Request(tx)
        .input("f1", mssql.VarChar, followerId)
        .input("f2", mssql.VarChar, followingId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM follows WHERE follower_id = @f1 AND following_id = @f2)
          BEGIN
            INSERT INTO follows (follower_id, following_id) VALUES (@f1, @f2);
            UPDATE users SET following_count = following_count + 1 WHERE id = @f1;
            UPDATE users SET followers_count = followers_count + 1 WHERE id = @f2;
          END
        `);
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  unfollow: async (followerId: string, followingId: string): Promise<void> => {
    const pool = await getConnection();
    const tx = new mssql.Transaction(pool);
    await tx.begin();
    try {
      await new mssql.Request(tx)
        .input("f1", mssql.VarChar, followerId)
        .input("f2", mssql.VarChar, followingId)
        .query(`
          IF EXISTS (SELECT 1 FROM follows WHERE follower_id = @f1 AND following_id = @f2)
          BEGIN
            DELETE FROM follows WHERE follower_id = @f1 AND following_id = @f2;
            UPDATE users SET following_count = CASE WHEN following_count > 0 THEN following_count - 1 ELSE 0 END WHERE id = @f1;
            UPDATE users SET followers_count = CASE WHEN followers_count > 0 THEN followers_count - 1 ELSE 0 END WHERE id = @f2;
          END
        `);
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  isFollowing: async (followerId: string, followingId: string): Promise<boolean> => {
    try {
      const pool = await getConnection();
      const r = await pool
        .request()
        .input("f1", mssql.VarChar, followerId)
        .input("f2", mssql.VarChar, followingId)
        .query("SELECT 1 FROM follows WHERE follower_id = @f1 AND following_id = @f2");
      return r.recordset.length > 0;
    } catch {
      return false;
    }
  },

  // ──────────────────────────────────────────
  // LEGACY (giữ cho authService)
  // ──────────────────────────────────────────
  findByEmail: async (email: string) => {
    const pool = await getConnection();
    const r = await pool.request()
      .input("email", mssql.VarChar, email)
      .query("SELECT * FROM users WHERE email = @email");
    return r.recordset[0] as any;
  },

  findByUsername: async (username: string) => {
    const pool = await getConnection();
    const r = await pool.request()
      .input("username", mssql.NVarChar, username)
      .query("SELECT * FROM users WHERE username = @username");
    return r.recordset[0] as any;
  },

  findById: async (id: string) => {
    const pool = await getConnection();
    const r = await pool.request()
      .input("id", mssql.VarChar, id)
      .query("SELECT * FROM users WHERE id = @id");
    return r.recordset[0] as any;
  },

  create: async (user: {
    id: string;
    username: string;
    email: string;
    password_hash: string;
  }): Promise<void> => {
    const pool = await getConnection();
    const tx = new mssql.Transaction(pool);
    await tx.begin();
    try {
      await new mssql.Request(tx)
        .input("id", mssql.VarChar, user.id)
        .input("username", mssql.NVarChar, user.username)
        .input("email", mssql.VarChar, user.email)
        .input("password_hash", mssql.VarChar, user.password_hash)
        .input("status", mssql.VarChar, "active")
        .query(`
          INSERT INTO users (id, username, email, password_hash, status)
          VALUES (@id, @username, @email, @password_hash, @status)
        `);
      await new mssql.Request(tx)
        .input("userId", mssql.VarChar, user.id)
        .input("roleId", mssql.VarChar, "role_user")
        .query(`
          IF EXISTS (SELECT 1 FROM app_roles WHERE id = @roleId)
            INSERT INTO user_roles (user_id, role_id) VALUES (@userId, @roleId)
        `);
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },
};
