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
  type User,
  type Transaction,
} from "@shared/schema";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The user ID
 *         username:
 *           type: string
 *           description: The username
 *         email:
 *           type: string
 *           description: The user's email
 *         fullName:
 *           type: string
 *           description: The user's full name
 *       example:
 *         id: 1
 *         username: john_doe
 *         email: john@example.com
 *         fullName: John Doe
 *     
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The transaction ID
 *         userId:
 *           type: integer
 *           description: The user ID associated with this transaction
 *         type:
 *           type: string
 *           enum: [deposit, withdrawal, transfer]
 *           description: Type of transaction
 *         amount:
 *           type: number
 *           description: Transaction amount
 *         description:
 *           type: string
 *           description: Description of the transaction
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *           description: Status of the transaction
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the transaction was created
 *       example:
 *         id: 1
 *         userId: 1
 *         type: deposit
 *         amount: 500
 *         description: Wallet funding
 *         status: completed
 *         createdAt: 2023-01-01T00:00:00.000Z
 *   
 *     Balance:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The balance ID
 *         userId:
 *           type: integer
 *           description: The user ID associated with this balance
 *         amount:
 *           type: number
 *           description: Current balance amount
 *       example:
 *         id: 1
 *         userId: 1
 *         amount: 1000
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

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
  
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *               - confirmPassword
   *               - fullName
   *               - terms
   *             properties:
   *               username:
   *                 type: string
   *                 description: Unique username
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User email
   *               password:
   *                 type: string
   *                 format: password
   *                 minLength: 6
   *                 description: User password
   *               confirmPassword:
   *                 type: string
   *                 format: password
   *                 description: Password confirmation
   *               fullName:
   *                 type: string
   *                 description: User's full name
   *               terms:
   *                 type: boolean
   *                 description: Acceptance of terms and conditions
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *                 token:
   *                   type: string
   *       400:
   *         description: Invalid input or email/username already taken
   */
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
  
  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login a user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User email
   *               password:
   *                 type: string
   *                 format: password
   *                 description: User password
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *                 token:
   *                   type: string
   *       401:
   *         description: Invalid email or password
   */
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
  /**
   * @swagger
   * /users/me:
   *   get:
   *     summary: Get current authenticated user's profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *                 balance:
   *                   type: number
   *                   description: User's wallet balance
   *       401:
   *         description: Unauthorized - Invalid or missing token
   *       404:
   *         description: User not found
   */
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
  /**
   * @swagger
   * /wallet/balance:
   *   get:
   *     summary: Get user's wallet balance
   *     tags: [Wallet]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Balance retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 balance:
   *                   type: number
   *                   description: User's current balance
   *       401:
   *         description: Unauthorized - Invalid or missing token
   *       404:
   *         description: Balance not found
   */
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
  
  /**
   * @swagger
   * /wallet/fund:
   *   post:
   *     summary: Fund the user's wallet
   *     tags: [Wallet]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *             properties:
   *               amount:
   *                 type: number
   *                 description: Amount to fund
   *     responses:
   *       200:
   *         description: Wallet funded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 transaction:
   *                   $ref: '#/components/schemas/Transaction'
   *                 balance:
   *                   type: number
   *                   description: Updated balance
   *       400:
   *         description: Invalid amount
   *       401:
   *         description: Unauthorized - Invalid or missing token
   */
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
  /**
   * @swagger
   * /transactions:
   *   get:
   *     summary: Get user's transaction history
   *     tags: [Transactions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: List of transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 transactions:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Transaction'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                       description: Total number of transactions
   *                     page:
   *                       type: integer
   *                       description: Current page
   *                     limit:
   *                       type: integer
   *                       description: Number of items per page
   *                     totalPages:
   *                       type: integer
   *                       description: Total number of pages
   *       401:
   *         description: Unauthorized - Invalid or missing token
   */
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
