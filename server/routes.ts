import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  loginSchema,
  registerSchema,
  fundWalletSchema,
  withdrawSchema,
  transferSchema,
} from "@shared/schema";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "credpal-secret-key";
const JWT_EXPIRY = "7d";

// Middleware to verify JWT token
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Error handling for Zod validation errors
const handleZodError = (err: unknown, res: Response) => {
  if (err instanceof ZodError) {
    const formattedError = fromZodError(err);
    return res.status(400).json({ message: formattedError.message, errors: err.errors });
  }
  return res.status(500).json({ message: "Internal server error" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();
  
  // Auth routes
  router.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user with email already exists
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Check if username is taken
      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Create user (omitting confirmPassword)
      const { confirmPassword, ...userData } = data;
      const user = await storage.createUser(userData);
      
      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
      
      return res.status(201).json({
        message: "Registration successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
        token,
      });
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  router.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.validateCredentials(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
      
      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
        token,
      });
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  // User routes
  router.get("/users/me", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's balance
      const balance = await storage.getBalanceByUserId(userId);
      
      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          bankAccount: user.bankAccount,
        },
        balance: balance?.amount || 0,
      });
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Wallet routes
  router.get("/wallet/balance", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const balance = await storage.getBalanceByUserId(userId);
      
      if (!balance) {
        return res.status(404).json({ message: "Balance not found" });
      }
      
      return res.status(200).json({ balance: balance.amount });
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.post("/wallet/fund", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { amount } = fundWalletSchema.parse(req.body);
      
      const transaction = await storage.fundWallet(userId, amount);
      const balance = await storage.getBalanceByUserId(userId);
      
      return res.status(200).json({
        message: "Wallet funded successfully",
        transaction,
        balance: balance?.amount || 0,
      });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      return handleZodError(err, res);
    }
  });
  
  router.post("/wallet/withdraw", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { amount, bankAccount, bankName } = withdrawSchema.parse(req.body);
      
      const transaction = await storage.withdrawFromWallet(userId, amount, bankAccount, bankName);
      const balance = await storage.getBalanceByUserId(userId);
      
      return res.status(200).json({
        message: "Withdrawal successful",
        transaction,
        balance: balance?.amount || 0,
      });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      return handleZodError(err, res);
    }
  });
  
  router.post("/wallet/transfer", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { amount, recipientEmail, description } = transferSchema.parse(req.body);
      
      const transaction = await storage.transferFunds(userId, recipientEmail, amount, description);
      const balance = await storage.getBalanceByUserId(userId);
      
      return res.status(200).json({
        message: "Transfer successful",
        transaction,
        balance: balance?.amount || 0,
      });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      return handleZodError(err, res);
    }
  });
  
  // Transaction routes
  router.get("/transactions", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { transactions, total } = await storage.getTransactionsByUserId(userId, page, limit);
      
      return res.status(200).json({
        transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Register routes
  app.use("/api", router);
  
  const httpServer = createServer(app);
  return httpServer;
}
