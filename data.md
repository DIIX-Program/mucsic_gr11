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