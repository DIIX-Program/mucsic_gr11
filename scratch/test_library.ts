import { userRepository } from "../src/backend/repositories/userRepository.js";
import dotenv from "dotenv";
dotenv.config();

async function debug() {
  try {
    console.log("Testing findLibrary...");
    const data = await userRepository.findLibrary("user_default_001");
    console.log("Success:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error in findLibrary:", err);
  }
}

debug();
