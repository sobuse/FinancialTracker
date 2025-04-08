import { pgTable, text, serial, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  bankAccount: text("bank_account"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(), // 'deposit', 'withdrawal', 'transfer'
  status: text("status").notNull(), // 'pending', 'approved', 'rejected'
  description: text("description"),
  recipientId: integer("recipient_id").references(() => users.id), // for transfers
  transactionId: text("transaction_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const balances = pgTable("balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  amount: doublePrecision("amount").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  transactions: many(transactions),
  balance: one(balances, {
    fields: [users.id],
    references: [balances.userId],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [transactions.recipientId],
    references: [users.id],
  }),
}));

export const balancesRelations = relations(balances, ({ one }) => ({
  user: one(users, {
    fields: [balances.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true
});

export const insertBalanceSchema = createInsertSchema(balances).omit({
  id: true,
  updatedAt: true
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Transaction schemas
export const fundWalletSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.string(),
});

export const withdrawSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  bankAccount: z.string(),
  bankName: z.string(),
});

export const transferSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  recipientEmail: z.string().email("Please enter a valid email"),
  description: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Balance = typeof balances.$inferSelect;
export type InsertBalance = z.infer<typeof insertBalanceSchema>;

export type FundWalletData = z.infer<typeof fundWalletSchema>;
export type WithdrawData = z.infer<typeof withdrawSchema>;
export type TransferData = z.infer<typeof transferSchema>;
