import mssql from 'mssql';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getConnection } from '../config/db.js';

dotenv.config();

/**
 * Seed Script for Music App
 * 1. Creates Roles (ADMIN, USER)
 * 2. Creates 1 Admin account
 * 3. Creates 5 regular User accounts
 */
async function seed() {
  console.log('🌱 Starting database seeding...');
  const pool = await getConnection();

  try {
    // 1. CLEAR EXISTING DATA (Optional - be careful in production)
    // For local dev, we might want to start fresh to avoid primary key conflicts
    // await pool.request().query("DELETE FROM user_roles; DELETE FROM users; DELETE FROM app_roles;");

    // 2. CREATE ROLES
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

    // 3. CREATE ADMIN
    console.log('Creating Admin...');
    const adminId = crypto.randomUUID();
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
        END
      `);

    // 4. CREATE 5 USERS
    console.log('Creating 5 Users...');
    for (let i = 1; i <= 5; i++) {
      const userId = crypto.randomUUID();
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
          END
        `);
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
