import bcrypt from "bcrypt";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import type { Request, Response, NextFunction } from "express";

// Create PostgreSQL session store
const PgSession = connectPgSimple(session);

// Session configuration
export const sessionConfig = session({
  secret: process.env.SESSION_SECRET || "tournament-admin-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  store: process.env.DATABASE_URL ? new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'sessions'
  }) : undefined,
  cookie: {
    // Simplified cookie settings for better Replit deployment compatibility
    secure: false, // Allow non-HTTPS for testing, will be overridden in production
    httpOnly: true,
    sameSite: "lax", // Most compatible setting
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  proxy: process.env.NODE_ENV === "production", // Trust proxy in production
  name: 'tournament.sid' // Custom session name to avoid conflicts
});

// Extend Express Request type to include session
declare module "express-session" {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Authentication middleware
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Invalid session" });
  }
  
  next();
}

// Admin authentication middleware
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Invalid session" });
  }
  
  // For now, we'll consider the first user (admin) as the only admin
  if (user.id !== 1) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
}

// Check if admin user exists
export async function checkAdminExists(): Promise<boolean> {
  const adminUser = await storage.getUserByUsername("admin");
  return !!adminUser;
}

// Create initial admin user
export async function createInitialAdmin(password: string): Promise<void> {
  const hashedPassword = await hashPassword(password);
  await storage.createUser({
    username: "admin",
    password: hashedPassword
  });
}