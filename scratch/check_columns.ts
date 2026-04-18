import { getConnection } from "../src/backend/config/db.js";
import mssql from "mssql";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const pool = await getConnection();
  const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'listening_history'");
  console.log(JSON.stringify(res.recordset, null, 2));
  process.exit(0);
}
run();
