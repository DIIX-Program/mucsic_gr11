import { getConnection } from "../src/backend/config/db.js";

async function diagnostic() {
  console.log("--- DIAGNOSTIC START ---");
  try {
    const pool = await getConnection();
    
    console.log("1. Checking Users...");
    const users = await pool.request().query("SELECT TOP 5 id, username FROM users");
    console.table(users.recordset);

    console.log("2. Checking Storage Objects (Local)...");
    const storage = await pool.request().query("SELECT TOP 10 id, path, object_type FROM storage_objects WHERE path LIKE '%nhac%'");
    console.table(storage.recordset);

    console.log("3. Checking Tracks (Local)...");
    const tracks = await pool.request().query(`
      SELECT TOP 10 t.id, t.title, t.status, t.visibility, s.path 
      FROM tracks t
      JOIN storage_objects s ON t.audio_object_id = s.id
      WHERE s.path LIKE '%nhac%'
    `);
    console.table(tracks.recordset);

    console.log("4. Checking Home API Data (Trending)...");
    const trending = await pool.request().query("SELECT COUNT(*) as count FROM tracks WHERE status = 'APPROVED' AND visibility = 'PUBLIC'");
    console.log("Approved public tracks count:", trending.recordset[0].count);

  } catch (err) {
    console.error("DIAGNOSTIC ERROR:", err);
  }
  console.log("--- DIAGNOSTIC END ---");
  process.exit(0);
}

diagnostic();
