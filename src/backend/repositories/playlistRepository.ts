import { getConnection } from "../config/db.js";
import mssql from 'mssql';

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  cover_url?: string;
  visibility?: string;
  status?: string;
  created_at: string;
}

/**
 * Playlist Repository - SQL Server Implementation
 */
export const playlistRepository = {
  create: async (playlist: Omit<Playlist, "created_at">): Promise<void> => {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('id', mssql.VarChar, playlist.id)
        .input('userId', mssql.VarChar, playlist.user_id)
        .input('name', mssql.NVarChar, playlist.name)
        .input('coverUrl', mssql.VarChar, playlist.cover_url || null)
        .input('visibility', mssql.VarChar, playlist.visibility || 'PRIVATE')
        .input('status', mssql.VarChar, playlist.status || 'APPROVED')
        .query("INSERT INTO playlists (id, user_id, name, cover_url, visibility, status) VALUES (@id, @userId, @name, @coverUrl, @visibility, @status)");
    } catch (error) {
      console.error('Error in playlistRepository.create:', error);
      throw error;
    }
  },

  findById: async (id: string): Promise<any | undefined> => {
    try {
      const pool = await getConnection();
      const playlistResult = await pool.request()
        .input('id', mssql.VarChar, id)
        .query("SELECT * FROM playlists WHERE id = @id");
      
      const playlist = playlistResult.recordset[0] as Playlist | undefined;
      if (!playlist) return undefined;
      
      const trackCountResult = await pool.request()
        .input('id', mssql.VarChar, id)
        .query("SELECT COUNT(*) as count FROM playlist_tracks WHERE playlist_id = @id");
      
      return { ...playlist, track_count: trackCountResult.recordset[0].count };
    } catch (error) {
      console.error('Error in playlistRepository.findById:', error);
      throw error;
    }
  },

  addTrack: async (playlist_id: string, track_id: string, position: number): Promise<void> => {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('playlistId', mssql.VarChar, playlist_id)
        .input('trackId', mssql.VarChar, track_id)
        .input('pos', mssql.Int, position)
        .query("INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (@playlistId, @trackId, @pos)");
    } catch (error) {
      console.error('Error in playlistRepository.addTrack:', error);
      throw error;
    }
  },

  isTrackInPlaylist: async (playlist_id: string, track_id: string): Promise<boolean> => {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('playlistId', mssql.VarChar, playlist_id)
        .input('trackId', mssql.VarChar, track_id)
        .query("SELECT 1 as exists_flag FROM playlist_tracks WHERE playlist_id = @playlistId AND track_id = @trackId");
      return result.recordset.length > 0;
    } catch (error) {
      console.error('Error in playlistRepository.isTrackInPlaylist:', error);
      throw error;
    }
  },

  removeTrack: async (playlist_id: string, track_id: string): Promise<void> => {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('playlistId', mssql.VarChar, playlist_id)
        .input('trackId', mssql.VarChar, track_id)
        .query("DELETE FROM playlist_tracks WHERE playlist_id = @playlistId AND track_id = @trackId");
    } catch (error) {
      console.error('Error in playlistRepository.removeTrack:', error);
      throw error;
    }
  },

  getTracks: async (playlist_id: string): Promise<any[]> => {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('playlistId', mssql.VarChar, playlist_id)
        .query(`
          SELECT 
            t.id, 
            t.title, 
            t.main_artist, 
            t.plays_count, 
            t.created_at, 
            s_audio.path as file_path,
            s_image.path as cover_url,
            pt.position, 
            pt.added_at 
          FROM tracks t
          JOIN playlist_tracks pt ON t.id = pt.track_id
          JOIN storage_objects s_audio ON t.audio_object_id = s_audio.id
          LEFT JOIN storage_objects s_image ON t.cover_image_object_id = s_image.id
          WHERE pt.playlist_id = @playlistId AND t.status = 'APPROVED'
          ORDER BY pt.position ASC
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error in playlistRepository.getTracks:', error);
      throw error;
    }
  },

  getMaxPosition: async (playlist_id: string): Promise<number> => {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('playlistId', mssql.VarChar, playlist_id)
        .query("SELECT MAX(position) as maxPos FROM playlist_tracks WHERE playlist_id = @playlistId");
      return result.recordset[0].maxPos || 0;
    } catch (error) {
      console.error('Error in playlistRepository.getMaxPosition:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const pool = await getConnection();
      // Use transaction ideally, but for now sequential
      await pool.request().input('id', mssql.VarChar, id).query("DELETE FROM playlist_tracks WHERE playlist_id = @id");
      await pool.request().input('id', mssql.VarChar, id).query("DELETE FROM playlists WHERE id = @id");
    } catch (error) {
      console.error('Error in playlistRepository.delete:', error);
      throw error;
    }
  },

  update: async (id: string, name: string): Promise<void> => {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('name', mssql.NVarChar, name)
        .input('id', mssql.VarChar, id)
        .query("UPDATE playlists SET name = @name WHERE id = @id");
    } catch (error) {
      console.error('Error in playlistRepository.update:', error);
      throw error;
    }
  },

  findByUser: async (userId: string): Promise<any[]> => {
    try {
      const pool = await getConnection();
      // For findByUser, we usually only show PUBLIC playlists to others, but ALL to owner.
      // This repo method should just return what it's told. I'll handle filtering in the controller if needed,
      // or add an optional requesterUserId here.
      const playlistsResult = await pool.request()
        .input('userId', mssql.VarChar, userId)
        .query("SELECT * FROM playlists WHERE user_id = @userId ORDER BY created_at DESC");
      
      const playlists = playlistsResult.recordset as Playlist[];
      
      const playlistsWithCount = await Promise.all(playlists.map(async (p) => {
        const countRes = await pool.request()
          .input('id', mssql.VarChar, p.id)
          .query("SELECT COUNT(*) as count FROM playlist_tracks WHERE playlist_id = @id");
        return { ...p, track_count: countRes.recordset[0].count };
      }));
      
      return playlistsWithCount;
    } catch (error) {
      console.error('Error in playlistRepository.findByUser:', error);
      throw error;
    }
  },

  findByNameAndUser: async (name: string, userId: string): Promise<any | undefined> => {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('name', mssql.NVarChar, name)
        .input('userId', mssql.VarChar, userId)
        .query("SELECT * FROM playlists WHERE name = @name AND user_id = @userId");
      return result.recordset[0] as Playlist | undefined;
    } catch (error) {
      console.error('Error in playlistRepository.findByNameAndUser:', error);
      throw error;
    }
  }
};
