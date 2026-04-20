-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    display_name NVARCHAR(64),
    avatar_url NVARCHAR(255),
    banner_url NVARCHAR(255),
    bio NVARCHAR(255),

    status VARCHAR(16) NOT NULL,
    is_email_verified BIT NOT NULL DEFAULT 0,

    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,

    created_at DATETIME2 DEFAULT GETDATE()
);

-- =========================
-- ROLES (RBAC)
-- =========================
CREATE TABLE app_roles (
    id VARCHAR(50) PRIMARY KEY,
    name NVARCHAR(32) NOT NULL,
    max_tracks INT
);

CREATE TABLE user_roles (
    user_id VARCHAR(50),
    role_id VARCHAR(50),

    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES app_roles(id)
);

-- =========================
-- PASSWORD RESET
-- =========================
CREATE TABLE password_resets (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME2 NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- GENRES
-- =========================
CREATE TABLE genres (
    id VARCHAR(50) PRIMARY KEY,
    name NVARCHAR(64) NOT NULL,
    slug VARCHAR(64) UNIQUE NOT NULL
);

-- =========================
-- STORAGE
-- =========================
CREATE TABLE storage_objects (
    id VARCHAR(50) PRIMARY KEY,
    owner_user_id VARCHAR(50) NOT NULL,
    object_type VARCHAR(16) NOT NULL,
    path NVARCHAR(255) NOT NULL,
    mime_type VARCHAR(128),
    size_bytes BIGINT,
    status VARCHAR(16) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

-- =========================
-- ALBUMS
-- =========================
CREATE TABLE albums (
    id VARCHAR(50) PRIMARY KEY,
    title NVARCHAR(150) NOT NULL,
    artist NVARCHAR(150),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- =========================
-- TRACKS
-- =========================
CREATE TABLE tracks (
    id VARCHAR(50) PRIMARY KEY,
    uploader_user_id VARCHAR(50) NOT NULL,

    title NVARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    description NVARCHAR(MAX),

    genre_id VARCHAR(50),
    album_id VARCHAR(50),

    main_artist NVARCHAR(150),

    audio_object_id VARCHAR(50) NOT NULL,
    cover_image_object_id VARCHAR(50),

    visibility VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL,

    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    plays_count BIGINT DEFAULT 0,
    reposts_count INT DEFAULT 0,

    lyrics_lrc NVARCHAR(MAX),

    scheduled_at DATETIME2,
    release_date DATE,

    created_at DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (uploader_user_id) REFERENCES users(id),
    FOREIGN KEY (genre_id) REFERENCES genres(id),
    FOREIGN KEY (album_id) REFERENCES albums(id),
    FOREIGN KEY (audio_object_id) REFERENCES storage_objects(id),
    FOREIGN KEY (cover_image_object_id) REFERENCES storage_objects(id)
);

-- =========================
-- PLAYLISTS
-- =========================
CREATE TABLE playlists (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name NVARCHAR(150) NOT NULL,

    created_at DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (user_id) REFERENCES users(id),

    CONSTRAINT unique_user_playlist UNIQUE (user_id, name)
);

-- MANY-TO-MANY
CREATE TABLE playlist_tracks (
    playlist_id VARCHAR(50),
    track_id VARCHAR(50),

    added_at DATETIME2 DEFAULT GETDATE(),

    PRIMARY KEY (playlist_id, track_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id),
    FOREIGN KEY (track_id) REFERENCES tracks(id)
);

-- =========================
-- TRACK LIKES
-- =========================
CREATE TABLE track_likes (
    track_id VARCHAR(50),
    user_id VARCHAR(50),

    created_at DATETIME2 DEFAULT GETDATE(),

    PRIMARY KEY (track_id, user_id),
    FOREIGN KEY (track_id) REFERENCES tracks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- COMMENTS
-- =========================
CREATE TABLE comments (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    track_id VARCHAR(50) NOT NULL,

    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (track_id) REFERENCES tracks(id)
);

-- =========================
-- LISTENING HISTORY (BONUS XỊN)
-- =========================
CREATE TABLE listening_history (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    track_id VARCHAR(50),

    listened_at DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (track_id) REFERENCES tracks(id)
);

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,

    type VARCHAR(32),
    actor_user_id VARCHAR(50),

    track_id VARCHAR(50),
    playlist_id VARCHAR(50),

    message NVARCHAR(MAX),
    is_read BIT DEFAULT 0,

    created_at DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- INDEX (BASIC)
-- =========================
CREATE INDEX idx_tracks_search 
ON tracks(title, main_artist);

CREATE INDEX idx_playlist_user 
ON playlists(user_id);

CREATE INDEX idx_history_user 
ON listening_history(user_id);



// Thêm Nghệ Sỹ 
-- 1. Thêm vai trò ARTIST vào hệ thống nếu chưa có
IF NOT EXISTS (SELECT 1 FROM app_roles WHERE id = 'role_artist')
BEGIN
    INSERT INTO app_roles (id, name, max_tracks) VALUES ('role_artist', 'ARTIST', 100);
END
GO

-- 2. Tạo bảng artists (Nghệ sĩ)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'artists')
BEGIN
    CREATE TABLE artists (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL UNIQUE,
      artist_name NVARCHAR(100) NOT NULL,
      bio NVARCHAR(MAX),
      avatar_url VARCHAR(MAX),
      banner_url VARCHAR(MAX),
      verified BIT DEFAULT 0,
      created_at DATETIME DEFAULT GETDATE(),
      CONSTRAINT FK_Artists_Users FOREIGN KEY (user_id) REFERENCES users(id)
    );
END
GO

-- 3. Cập nhật bảng tracks để liên kết với Nghệ sĩ
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tracks') AND name = 'artist_id')
BEGIN
    ALTER TABLE tracks ADD artist_id VARCHAR(50);
    ALTER TABLE tracks ADD CONSTRAINT FK_Tracks_Artists FOREIGN KEY (artist_id) REFERENCES artists(id);
END
GO

-- 4. (Tùy chọn) Cập nhật các bài hát hiện có để liên kết với bảng artists mới nếu cần
-- Bước này sẽ phụ thuộc vào việc bạn migrate dữ liệu cũ như thế nào.

-- Migration script for Artist and Comment improvements

-- 1. Add 'status' and 'verified' to artists if they don't exist correctly
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('artists') AND name = 'status')
BEGIN
    ALTER TABLE artists ADD status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
END
GO

-- 2. Add 'artist_id' to tracks if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tracks') AND name = 'artist_id')
BEGIN
    ALTER TABLE tracks ADD artist_id VARCHAR(50);
    ALTER TABLE tracks ADD CONSTRAINT FK_Tracks_Artists FOREIGN KEY (artist_id) REFERENCES artists(id);
END
GO

-- 3. Add 'status' to tracks if it doesn't exist (it should already be there but let's double check)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tracks') AND name = 'status')
BEGIN
    ALTER TABLE tracks ADD status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
END
GO

-- 4. Ensure app_roles has ARTIST
IF NOT EXISTS (SELECT 1 FROM app_roles WHERE id = 'role_artist')
BEGIN
    INSERT INTO app_roles (id, name, max_tracks) VALUES ('role_artist', 'ARTIST', 100);
END
GO
