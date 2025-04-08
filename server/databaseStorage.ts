import { 
  users, 
  transactions, 
  balances, 
  type User, 
  type InsertUser, 
  type Transaction, 
  type InsertTransaction, 
  type Balance, 
  type InsertBalance 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await hash(insertUser.password, 10);
    
    // Create user with hashed password
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    
    // Create initial balance for the user
    await db
      .insert(balances)
      .values({ userId: user.id, amount: 0 });
    
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
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    
    return transaction;
  }

  async getTransactionsByUserId(userId: number, page = 1, limit = 10): Promise<{ transactions: Transaction[], total: number }> {
    // Get total count
    const [result] = await db
      .select({ value: count() })
      .from(transactions)
      .where(
        sql`${transactions.userId} = ${userId} OR ${transactions.recipientId} = ${userId}`
      );
    
    const total = Number(result?.value || 0);
    
    // Get paginated transactions
    const transactionList = await db
      .select()
      .from(transactions)
      .where(
        sql`${transactions.userId} = ${userId} OR ${transactions.recipientId} = ${userId}`
      )
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
    
    return {
      transactions: transactionList,
      total
    };
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    
    return transaction;
  }

  // Balance operations
  async getBalanceByUserId(userId: number): Promise<Balance | undefined> {
    const [balance] = await db
      .select()
      .from(balances)
      .where(eq(balances.userId, userId));
    
    return balance;
  }

  async createBalance(insertBalance: InsertBalance): Promise<Balance> {
    const [balance] = await db
      .insert(balances)
      .values(insertBalance)
      .returning();
    
    return balance;
  }

  async updateBalance(userId: number, amount: number): Promise<Balance> {
    const [updatedBalance] = await db
      .update(balances)
      .set({ amount, updatedAt: new Date() })
      .where(eq(balances.userId, userId))
      .returning();
    
    if (!updatedBalance) {
      throw new Error(`No balance found for user ${userId}`);
    }
    
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