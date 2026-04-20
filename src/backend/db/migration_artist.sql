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
