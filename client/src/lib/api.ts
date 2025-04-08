import { apiRequest } from "./queryClient";
import { 
  LoginCredentials, 
  RegisterData, 
  FundWalletData, 
  WithdrawData, 
  TransferData 
} from "@shared/schema";

// Auth API
export const login = async (credentials: LoginCredentials) => {
  const res = await apiRequest('POST', '/api/auth/login', credentials);
  return res.json();
};

export const register = async (data: Omit<RegisterData, 'confirmPassword'> & { confirmPassword: string }) => {
  const res = await apiRequest('POST', '/api/auth/register', data);
  return res.json();
};

export const getCurrentUser = async () => {
  const res = await apiRequest('GET', '/api/users/me');
  return res.json();
};

// Wallet API
export const getWalletBalance = async () => {
  const res = await apiRequest('GET', '/api/wallet/balance');
  return res.json();
};

export const fundWallet = async (data: FundWalletData) => {
  const res = await apiRequest('POST', '/api/wallet/fund', data);
  return res.json();
};

export const withdrawFromWallet = async (data: WithdrawData) => {
  const res = await apiRequest('POST', '/api/wallet/withdraw', data);
  return res.json();
};

export const transferFunds = async (data: TransferData) => {
  const res = await apiRequest('POST', '/api/wallet/transfer', data);
  return res.json();
};

// Transaction API
export const getTransactions = async (page = 1, limit = 10) => {
  const res = await apiRequest('GET', `/api/transactions?page=${page}&limit=${limit}`);
  return res.json();
};
