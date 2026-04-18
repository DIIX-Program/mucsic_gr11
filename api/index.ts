import { app, createApp } from "../server.js";

// Vercel serverless function handler
export default async (req: any, res: any) => {
  await createApp();
  return app(req, res);
};
