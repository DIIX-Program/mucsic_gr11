-- Update script to sync database with perfect synchronization requirements
-- Run this in SSMS on 'musicdb'

-- 1. Add visibility and status to playlists if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('playlists') AND name = 'cover_url')
BEGIN
    ALTER TABLE playlists ADD cover_url VARCHAR(MAX);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('playlists') AND name = 'visibility')
BEGIN
    ALTER TABLE playlists ADD visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('playlists') AND name = 'status')
BEGIN
    ALTER TABLE playlists ADD status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';
END
GO

-- 2. Create follows table for real relationships
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'follows')
BEGIN
    CREATE TABLE follows (
        follower_id VARCHAR(50) NOT NULL,
        following_id VARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        PRIMARY KEY (follower_id, following_id),
        CONSTRAINT FK_Follows_Follower FOREIGN KEY (follower_id) REFERENCES users(id),
        CONSTRAINT FK_Follows_Following FOREIGN KEY (following_id) REFERENCES users(id),
        CONSTRAINT CHK_No_Self_Follow CHECK (follower_id <> following_id)
    );
END
GO

-- 3. Set existing playlists to PUBLIC as a baseline
UPDATE playlists SET visibility = 'PUBLIC', status = 'APPROVED' WHERE visibility = 'PRIVATE';
