import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Transaction, FundWalletData, WithdrawData, TransferData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWalletBalance, getTransactions, fundWallet, withdrawFromWallet, transferFunds } from "@/lib/api";

// API response types
interface BalanceResponse {
  balance: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

interface WalletOperationResponse {
  balance: number;
  transaction: Transaction;
}

interface WalletContextType {
  balance: number;
  pendingAmount: number;
  transactions: Transaction[];
  totalTransactions: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  processing: boolean;
  
  // Modal states
  isFundModalOpen: boolean;
  isWithdrawModalOpen: boolean;
  isTransferModalOpen: boolean;
  isCardPaymentModalOpen: boolean;
  
  // Modal actions
  openFundModal: () => void;
  closeFundModal: () => void;
  openWithdrawModal: () => void;
  closeWithdrawModal: () => void;
  openTransferModal: () => void;
  closeTransferModal: () => void;
  openCardPaymentModal: () => void;
  closeCardPaymentModal: () => void;
  
  // Operations
  fundWallet: (amount: number, paymentMethod: string) => Promise<void>;
  withdrawFunds: (amount: number, bankAccount: string, bankName: string) => Promise<void>;
  transferFunds: (amount: number, recipientEmail: string, description?: string) => Promise<void>;
  
  // Pagination
  setPage: (page: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = true; // Always enabled in dashboard
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [balance, setBalance] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Modal states
  const [isFundModalOpen, setIsFundModalOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isCardPaymentModalOpen, setIsCardPaymentModalOpen] = useState<boolean>(false);
  
  // Fetch balance
  const balanceQuery = useQuery<BalanceResponse>({
    queryKey: ['/api/wallet/balance'],
    enabled: isAuthenticated,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch transactions
  const transactionsQuery = useQuery<TransactionsResponse>({
    queryKey: ['/api/transactions', currentPage],
    enabled: isAuthenticated,
    staleTime: 60000, // 1 minute
  });
  
  // Fund wallet mutation
  const fundMutation = useMutation<WalletOperationResponse, Error, FundWalletData>({
    mutationFn: fundWallet,
    onSuccess: (data) => {
      if (data && data.balance !== undefined) {
        setBalance(data.balance);
        toast({
          title: "Success",
          description: "Your wallet has been funded successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        closeCardPaymentModal();
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fund wallet. Please try again.",
      });
    },
  });
  
  // Withdraw funds mutation
  const withdrawMutation = useMutation<WalletOperationResponse, Error, WithdrawData>({
    mutationFn: withdrawFromWallet,
    onSuccess: (data) => {
      if (data && data.balance !== undefined) {
        setBalance(data.balance);
        toast({
          title: "Success",
          description: "Withdrawal initiated successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        closeWithdrawModal();
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to withdraw funds. Please try again.",
      });
    },
  });
  
  // Transfer funds mutation
  const transferMutation = useMutation<WalletOperationResponse, Error, TransferData>({
    mutationFn: transferFunds,
    onSuccess: (data) => {
      if (data && data.balance !== undefined) {
        setBalance(data.balance);
        toast({
          title: "Success",
          description: "Transfer completed successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        closeTransferModal();
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to transfer funds. Please try again.",
      });
    },
  });
  
  // Update state from queries
  useEffect(() => {
    if (balanceQuery.data && balanceQuery.data.balance !== undefined) {
      setBalance(balanceQuery.data.balance);
    }
  }, [balanceQuery.data]);
  
  useEffect(() => {
    if (transactionsQuery.data) {
      setTransactions(transactionsQuery.data.transactions || []);
      setTotalTransactions(transactionsQuery.data.pagination?.total || 0);
      setTotalPages(transactionsQuery.data.pagination?.totalPages || 0);
    }
  }, [transactionsQuery.data]);
  
  // Modal handlers
  const openFundModal = () => setIsFundModalOpen(true);
  const closeFundModal = () => setIsFundModalOpen(false);
  const openWithdrawModal = () => setIsWithdrawModalOpen(true);
  const closeWithdrawModal = () => setIsWithdrawModalOpen(false);
  const openTransferModal = () => setIsTransferModalOpen(true);
  const closeTransferModal = () => setIsTransferModalOpen(false);
  const openCardPaymentModal = () => {
    setIsFundModalOpen(false);
    setIsCardPaymentModalOpen(true);
  };
  const closeCardPaymentModal = () => setIsCardPaymentModalOpen(false);
  
  // Operations handlers
  const handleFundWallet = async (amount: number, paymentMethod: string) => {
    await fundMutation.mutateAsync({ amount, paymentMethod });
  };
  
  const handleWithdrawFunds = async (amount: number, bankAccount: string, bankName: string) => {
    await withdrawMutation.mutateAsync({ amount, bankAccount, bankName });
  };
  
  const handleTransferFunds = async (amount: number, recipientEmail: string, description?: string) => {
    await transferMutation.mutateAsync({ amount, recipientEmail, description });
  };
  
  // Pagination handler
  const setPage = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <WalletContext.Provider value={{
      balance,
      pendingAmount,
      transactions,
      totalTransactions,
      currentPage,
      totalPages,
      loading: balanceQuery.isLoading || transactionsQuery.isLoading,
      processing: fundMutation.isPending || withdrawMutation.isPending || transferMutation.isPending,
      
      // Modal states
      isFundModalOpen,
      isWithdrawModalOpen,
      isTransferModalOpen,
      isCardPaymentModalOpen,
      
      // Modal actions
      openFundModal,
      closeFundModal,
      openWithdrawModal,
      closeWithdrawModal,
      openTransferModal,
      closeTransferModal,
      openCardPaymentModal,
      closeCardPaymentModal,
      
      // Operations
      fundWallet: handleFundWallet,
      withdrawFunds: handleWithdrawFunds,
      transferFunds: handleTransferFunds,
      
      // Pagination
      setPage,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  
  return context;
}
