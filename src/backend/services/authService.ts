import bcrypt from "bcrypt";
import { userRepository } from "../repositories/userRepository.js";
import crypto from "crypto";

/**
 * Authentication Service
 * Handles user registration and login with async repository calls.
 */
export const authService = {
  /**
   * Register a new user
   */
  register: async (username: string, email: string, password_raw: string) => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const password_hash = await bcrypt.hash(password_raw, 10);
    const id = crypto.randomUUID();

    await userRepository.create({
      id,
      username,
      email,
      password_hash,
    });

    const isAdmin = await userRepository.isAdmin(id);
    return { id, username, email, isAdmin };
  },

  /**
   * Universal Login (Email or Username)
   */
  login: async (identifier: string, password_raw: string) => {
    // Check both email and username asynchronously
    let user = await userRepository.findByEmail(identifier);
    if (!user) {
      user = await userRepository.findByUsername(identifier);
    }

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password_raw, user.password_hash);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const isAdmin = await userRepository.isAdmin(user.id);
    return { id: user.id, username: user.username, email: user.email, isAdmin };
  },
};
