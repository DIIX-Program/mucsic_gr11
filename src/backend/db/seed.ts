import mssql from 'mssql';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getConnection } from '../config/db.js';

dotenv.config();

/**
 * Seed Script for Music App (SQL Server)
 * 1. Creates Roles (ADMIN, USER)
 * 2. Creates 1 Admin account (admin / 123456)
 * 3. Creates 5 regular User accounts (user1-5 / 123456)
 * 4. Seeds 3 tracks from the 'nhac' folder
 */
async function seed() {
  console.log('🌱 Starting database seeding for Music App...');
  let pool;
  try {
    pool = await getConnection();
  } catch (err) {
    console.error('❌ Could not connect to SQL Server. Please ensure it is running and accessible.');
    console.log('Credentials used:', {
      server: process.env.DB_SERVER || 'localhost',
      database: process.env.DB_NAME || 'musicdb',
      user: process.env.DB_USER || 'sa'
    });
    process.exit(1);
  }

  try {
    // 1. CREATE ROLES
    console.log('Creating Roles...');
    await pool.request()
      .input('id1', mssql.VarChar, 'role_admin')
      .input('name1', mssql.NVarChar, 'ADMIN')
      .input('id2', mssql.VarChar, 'role_user')
      .input('name2', mssql.NVarChar, 'USER')
      .query(`
        IF NOT EXISTS (SELECT 1 FROM app_roles WHERE id = 'role_admin')
          INSERT INTO app_roles (id, name, max_tracks) VALUES (@id1, @name1, 0);
        
        IF NOT EXISTS (SELECT 1 FROM app_roles WHERE id = 'role_user')
          INSERT INTO app_roles (id, name, max_tracks) VALUES (@id2, @name2, 50);
      `);

    const passwordHash = await bcrypt.hash('123456', 10);

    // 2. CREATE ADMIN
    console.log('Creating Admin Account...');
    const adminId = 'user_admin_001'; // Fixed ID for seeding
    await pool.request()
      .input('id', mssql.VarChar, adminId)
      .input('username', mssql.NVarChar, 'admin')
      .input('email', mssql.VarChar, 'admin@music.app')
      .input('password', mssql.VarChar, passwordHash)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
        BEGIN
          INSERT INTO users (id, username, email, password_hash, status)
          VALUES (@id, @username, @email, @password, 'active');
          
          INSERT INTO user_roles (user_id, role_id) VALUES (@id, 'role_admin');
          PRINT '✅ Admin account created: admin / 123456';
        END
      `);

    // 3. CREATE 5 USERS
    console.log('Creating 5 Regular User Accounts...');
    const userIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const userId = `user_default_00${i}`;
      userIds.push(userId);
      const username = `user${i}`;
      await pool.request()
        .input('id', mssql.VarChar, userId)
        .input('username', mssql.NVarChar, username)
        .input('email', mssql.VarChar, `${username}@music.app`)
        .input('password', mssql.VarChar, passwordHash)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM users WHERE username = @username)
          BEGIN
            INSERT INTO users (id, username, email, password_hash, status)
            VALUES (@id, @username, @email, @password, 'active');
            
            INSERT INTO user_roles (user_id, role_id) VALUES (@id, 'role_user');
            PRINT '✅ User account created: ' + @username + ' / 123456';
          END
        `);
    }

    // 4. SEED TRACKS FROM 'nhac' FOLDER
    console.log('Seeding Tracks from nhac folder...');
    const tracksToSeed = [
      { id: 'track_001', title: '50 Năm Về Sau', artist: 'Hồ Quang Hiếu', path: '/nhac/50namvesau.mp3' },
      { id: 'track_002', title: 'Đạo Bước Hồng Kông', artist: 'Hkt', path: '/nhac/daobuochongkong.mp3' },
      { id: 'track_003', title: 'Hóa Ra', artist: 'Hà Anh Tuấn', path: '/nhac/hoara.mp3' }
    ];

    for (const t of tracksToSeed) {
      const audioObjectId = `storage_audio_${t.id}`;
      
      // Insert Storage Object
      await pool.request()
        .input('sobj_id', mssql.VarChar, audioObjectId)
        .input('owner', mssql.VarChar, userIds[0])
        .input('type', mssql.VarChar, 'audio')
        .input('path', mssql.VarChar, t.path)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM storage_objects WHERE id = @sobj_id)
            INSERT INTO storage_objects (id, owner_user_id, object_type, path, status)
            VALUES (@sobj_id, @owner, @type, @path, 'active');
        `);

      // Insert Track
      await pool.request()
        .input('track_id', mssql.VarChar, t.id)
        .input('uploader', mssql.VarChar, userIds[0])
        .input('title', mssql.NVarChar, t.title)
        .input('artist', mssql.NVarChar, t.artist)
        .input('audioId', mssql.VarChar, audioObjectId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM tracks WHERE id = @track_id)
            INSERT INTO tracks (id, uploader_user_id, title, slug, main_artist, audio_object_id, visibility, status)
            VALUES (@track_id, @uploader, @title, @track_id, @artist, @audioId, 'PUBLIC', 'APPROVED');
        `);
      console.log(`✅ Seeded track: ${t.title}`);
    }

    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
