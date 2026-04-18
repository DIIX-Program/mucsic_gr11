-- SQL Script to Seed Data directly into SQL Server
-- Run this in SSMS or Azure Data Studio

USE [musicdb];
GO

-- 1. Insert Roles
IF NOT EXISTS (SELECT 1 FROM app_roles WHERE id = 'role_admin')
    INSERT INTO app_roles (id, name, max_tracks) VALUES ('role_admin', 'ADMIN', 0);

IF NOT EXISTS (SELECT 1 FROM app_roles WHERE id = 'role_user')
    INSERT INTO app_roles (id, name, max_tracks) VALUES ('role_user', 'USER', 50);
GO

-- 2. Insert Users (Password: 123456)
-- Hash generated via bcrypt: $2b$10$pz7un/pBzgfF8SvuZUB6vOXfy6urnhOME/JfmGAxCeuAKmRHKBAwy
DECLARE @passwordHash VARCHAR(255) = '$2b$10$pz7un/pBzgfF8SvuZUB6vOXfy6urnhOME/JfmGAxCeuAKmRHKBAwy';

-- Admin
IF EXISTS (SELECT 1 FROM users WHERE username = 'admin')
BEGIN
    UPDATE users SET password_hash = @passwordHash WHERE username = 'admin';
END
ELSE
BEGIN
    INSERT INTO users (id, username, email, password_hash, status)
    VALUES ('user_admin_001', 'admin', 'admin@music.app', @passwordHash, 'active');
    
    INSERT INTO user_roles (user_id, role_id) VALUES ('user_admin_001', 'role_admin');
END

-- 5 regular users
IF EXISTS (SELECT 1 FROM users WHERE username = 'user1')
    UPDATE users SET password_hash = @passwordHash WHERE username = 'user1';
ELSE
BEGIN
    INSERT INTO users (id, username, email, password_hash, status) VALUES ('user_u1', 'user1', 'user1@music.app', @passwordHash, 'active');
    INSERT INTO user_roles (user_id, role_id) VALUES ('user_u1', 'role_user');
END

-- ... (Repeating for others for completeness)
IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'user2')
BEGIN
    INSERT INTO users (id, username, email, password_hash, status) VALUES ('user_u2', 'user2', 'user2@music.app', @passwordHash, 'active');
    INSERT INTO user_roles (user_id, role_id) VALUES ('user_u2', 'role_user');
END
ELSE UPDATE users SET password_hash = @passwordHash WHERE username = 'user2';

IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'user3')
BEGIN
    INSERT INTO users (id, username, email, password_hash, status) VALUES ('user_u3', 'user3', 'user3@music.app', @passwordHash, 'active');
    INSERT INTO user_roles (user_id, role_id) VALUES ('user_u3', 'role_user');
END
ELSE UPDATE users SET password_hash = @passwordHash WHERE username = 'user3';

IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'user4')
BEGIN
    INSERT INTO users (id, username, email, password_hash, status) VALUES ('user_u4', 'user4', 'user4@music.app', @passwordHash, 'active');
    INSERT INTO user_roles (user_id, role_id) VALUES ('user_u4', 'role_user');
END
ELSE UPDATE users SET password_hash = @passwordHash WHERE username = 'user4';

IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'user5')
BEGIN
    INSERT INTO users (id, username, email, password_hash, status) VALUES ('user_u5', 'user5', 'user5@music.app', @passwordHash, 'active');
    INSERT INTO user_roles (user_id, role_id) VALUES ('user_u5', 'role_user');
END
ELSE UPDATE users SET password_hash = @passwordHash WHERE username = 'user5';
GO

-- 3. Insert Tracks from 'nhac' folder (already in DB but ensuring and path is correct)
IF NOT EXISTS (SELECT 1 FROM storage_objects WHERE id = 'storage_audio_track_001')
    INSERT INTO storage_objects (id, owner_user_id, object_type, path, status) VALUES ('storage_audio_track_001', 'user_u1', 'audio', '/nhac/50namvesau.mp3', 'active');
GO

PRINT '✨ Data and Password Hashes updated successfully!';
