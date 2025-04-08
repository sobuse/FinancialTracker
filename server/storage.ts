import { users, transactions, balances } from "@shared/schema";
import type { User, InsertUser, Transaction, InsertTransaction, Balance, InsertBalance } from "@shared/schema";
import { nanoid } from "nanoid";
import { compare, hash } from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Authentication
  validateCredentials(email: string, password: string): Promise<User | null>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUserId(userId: number, page?: number, limit?: number): Promise<{ transactions: Transaction[], total: number }>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  
  // Balance operations
  getBalanceByUserId(userId: number): Promise<Balance | undefined>;
  createBalance(balance: InsertBalance): Promise<Balance>;
  updateBalance(userId: number, amount: number): Promise<Balance>;
  
  // Wallet operations
  fundWallet(userId: number, amount: number): Promise<Transaction>;
  withdrawFromWallet(userId: number, amount: number, bankAccount: string, bankName: string): Promise<Transaction>;
  transferFunds(senderId: number, recipientEmail: string, amount: number, description?: string): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private balances: Map<number, Balance>;
  private currentUserId: number;
  private currentTransactionId: number;
  private currentBalanceId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.balances = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentBalanceId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await hash(insertUser.password, 10);
    const userId = this.currentUserId++;
    const now = new Date();
    
    const user: User = {
      ...insertUser,
      id: userId,
      password: hashedPassword,
      createdAt: now,
    };
    
    this.users.set(userId, user);
    
    // Create initial balance for user
    await this.createBalance({ userId, amount: 0 });
    
    return user;
  }

  // Authentication
  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return user;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: now,
    };
    
    this.transactions.set(id, transaction);
    
    return transaction;
  }

  async getTransactionsByUserId(userId: number, page = 1, limit = 10): Promise<{ transactions: Transaction[], total: number }> {
    const userTransactions = Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId || transaction.recipientId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const total = userTransactions.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      transactions: userTransactions.slice(start, end),
      total
    };
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  // Balance operations
  async getBalanceByUserId(userId: number): Promise<Balance | undefined> {
    return Array.from(this.balances.values()).find(balance => balance.userId === userId);
  }

  async createBalance(insertBalance: InsertBalance): Promise<Balance> {
    const id = this.currentBalanceId++;
    const now = new Date();
    
    const balance: Balance = {
      ...insertBalance,
      id,
      updatedAt: now,
    };
    
    this.balances.set(id, balance);
    
    return balance;
  }

  async updateBalance(userId: number, amount: number): Promise<Balance> {
    const balance = await this.getBalanceByUserId(userId);
    
    if (!balance) {
      throw new Error(`No balance found for user ${userId}`);
    }
    
    const updatedBalance: Balance = {
      ...balance,
      amount,
      updatedAt: new Date(),
    };
    
    this.balances.set(balance.id, updatedBalance);
    
    return updatedBalance;
  }

  // Wallet operations
  async fundWallet(userId: number, amount: number): Promise<Transaction> {
    // Get current balance
    const balance = await this.getBalanceByUserId(userId);
    
    if (!balance) {
      throw new Error(`No balance found for user ${userId}`);
    }
    
    // Update balance
    await this.updateBalance(userId, balance.amount + amount);
    
    // Create transaction record
    const transaction: InsertTransaction = {
      userId,
      amount,
      type: 'deposit',
      status: 'approved',
      description: 'Wallet funding',
      transactionId: `TXN${nanoid(8)}`,
    };
    
    return this.createTransaction(transaction);
  }

  async withdrawFromWallet(userId: number, amount: number, bankAccount: string, bankName: string): Promise<Transaction> {
    // Get current balance
    const balance = await this.getBalanceByUserId(userId);
    
    if (!balance) {
      throw new Error(`No balance found for user ${userId}`);
    }
    
    // Check if user has sufficient balance
    if (balance.amount < amount) {
      throw new Error('Insufficient balance');
    }
    
    // Update balance
    await this.updateBalance(userId, balance.amount - amount);
    
    // Create transaction record
    const transaction: InsertTransaction = {
      userId,
      amount,
      type: 'withdrawal',
      status: 'approved',
      description: `Withdrawal to ${bankName} account ${bankAccount}`,
      transactionId: `TXN${nanoid(8)}`,
    };
    
    return this.createTransaction(transaction);
  }

  async transferFunds(senderId: number, recipientEmail: string, amount: number, description?: string): Promise<Transaction> {
    // Get sender's balance
    const senderBalance = await this.getBalanceByUserId(senderId);
    
    if (!senderBalance) {
      throw new Error(`No balance found for sender ${senderId}`);
    }
    
    // Check if sender has sufficient balance
    if (senderBalance.amount < amount) {
      throw new Error('Insufficient balance');
    }
    
    // Find recipient by email
    const recipient = await this.getUserByEmail(recipientEmail);
    
    if (!recipient) {
      throw new Error(`Recipient with email ${recipientEmail} not found`);
    }
    
    // Get recipient's balance
    const recipientBalance = await this.getBalanceByUserId(recipient.id);
    
    if (!recipientBalance) {
      throw new Error(`No balance found for recipient ${recipient.id}`);
    }
    
    // Update balances
    await this.updateBalance(senderId, senderBalance.amount - amount);
    await this.updateBalance(recipient.id, recipientBalance.amount + amount);
    
    // Create transaction record
    const transaction: InsertTransaction = {
      userId: senderId,
      recipientId: recipient.id,
      amount,
      type: 'transfer',
      status: 'approved',
      description: description || `Transfer to ${recipient.email}`,
      transactionId: `TXN${nanoid(8)}`,
    };
    
    return this.createTransaction(transaction);
  }
}

export const storage = new MemStorage();
