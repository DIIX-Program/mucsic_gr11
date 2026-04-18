import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * AI Service - Integrates with Google Gemini
 */
export const aiService = {
  /**
   * Generates a compelling track description based on title and artist.
   */
  generateTrackDescription: async (title: string, artist: string): Promise<string> => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in .env");
    }

    try {
      const prompt = `Write a short, poetic, and compelling music description (in Vietnamese) for a song titled "${title}" by "${artist}". The description should be around 2-3 sentences and feel cinematic. Do not use quotes.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      console.error("AI Service Error:", error);
      throw new Error("Failed to generate description with AI");
    }
  }
};
