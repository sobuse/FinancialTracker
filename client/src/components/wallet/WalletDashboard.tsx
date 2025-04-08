import { useWallet } from "@/contexts/WalletContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Info } from "lucide-react";
import TransactionTable from "./TransactionTable";
import FundWalletModal from "./FundWalletModal";
import WithdrawModal from "./WithdrawModal";
import TransferModal from "./TransferModal";
import CardPaymentModal from "./CardPaymentModal";
import { useToast } from "@/hooks/use-toast";

export default function WalletDashboard() {
  const { 
    balance, 
    pendingAmount, 
    loading,
    openFundModal,
    openWithdrawModal,
    openTransferModal,
    isFundModalOpen,
    isWithdrawModalOpen,
    isTransferModalOpen,
    isCardPaymentModalOpen
  } = useWallet();
  
  const { toast } = useToast();

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: message,
    });
  };

  const bankDetails = "Wema Bank 010 210 2020";

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="col-span-1 h-80 bg-card rounded-lg border"></div>
        <div className="col-span-1 lg:col-span-2 h-96 bg-card rounded-lg border"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Balance Section */}
        <Card className="col-span-1">
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-medium text-muted-foreground">Actual Balance</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(formatCurrency(balance), "Balance copied to clipboard")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col">
                <p className="text-2xl font-semibold">{formatCurrency(balance)}</p>
              </div>
            </div>
            
            <div className="flex items-center py-3 border-t">
              <i className="fas fa-university text-muted-foreground mr-2"></i>
              <span className="text-sm">{bankDetails}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => copyToClipboard(bankDetails, "Bank details copied to clipboard")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-medium text-muted-foreground">Pending Amount</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
              <p className="font-semibold">{formatCurrency(pendingAmount)}</p>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-2">
              <Button 
                onClick={openFundModal}
                className="col-span-1 bg-primary text-black hover:bg-yellow-500 font-medium py-2 h-auto"
              >
                Add Funds
              </Button>
              <Button 
                onClick={openWithdrawModal}
                variant="outline" 
                className="col-span-1 text-muted-foreground font-medium py-2 h-auto"
              >
                Withdrawal
              </Button>
              <Button 
                onClick={openTransferModal}
                variant="outline" 
                className="col-span-1 text-muted-foreground font-medium py-2 h-auto"
              >
                Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Transaction Table */}
        <div className="col-span-1 lg:col-span-2">
          <TransactionTable />
        </div>
      </div>
      
      {/* Modals */}
      {isFundModalOpen && <FundWalletModal />}
      {isWithdrawModalOpen && <WithdrawModal />}
      {isTransferModalOpen && <TransferModal />}
      {isCardPaymentModalOpen && <CardPaymentModal />}
    </>
  );
}
