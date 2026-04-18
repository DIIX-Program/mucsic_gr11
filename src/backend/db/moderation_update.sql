-- Add status column to comments table for moderation
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[comments]') 
    AND name = 'status'
)
BEGIN
    ALTER TABLE comments ADD status VARCHAR(16) DEFAULT 'PENDING';
END
GO

-- Update existing comments to APPROVED so they don't disappear
UPDATE comments SET status = 'APPROVED' WHERE status IS NULL;
GO
