import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function FundWalletModal() {
  const { isFundModalOpen, closeFundModal, openCardPaymentModal } = useWallet();
  const [selectedMethod, setSelectedMethod] = useState("creditCard");

  const handleContinue = () => {
    if (selectedMethod === "creditCard") {
      openCardPaymentModal();
    }
  };

  return (
    <Dialog open={isFundModalOpen} onOpenChange={closeFundModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Option</DialogTitle>
        </DialogHeader>
        
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={setSelectedMethod}
          className="space-y-3 my-4"
        >
          <div className={`border rounded-md p-3 flex items-center ${selectedMethod === "bankTransfer" ? "border-primary" : "border-input"}`}>
            <RadioGroupItem value="bankTransfer" id="bankTransfer" className="mr-3" />
            <Label htmlFor="bankTransfer" className="flex-1 flex items-center cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Bank Transfer</span>
            </Label>
          </div>
          
          <div className={`border rounded-md p-3 flex items-center ${selectedMethod === "creditCard" ? "border-primary" : "border-input"}`}>
            <RadioGroupItem value="creditCard" id="creditCard" className="mr-3" />
            <Label htmlFor="creditCard" className="flex-1 flex items-center justify-between cursor-pointer">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Add Debit/Credit Card</span>
              </div>
            </Label>
          </div>
          
          <div className={`border rounded-md p-3 flex items-center ${selectedMethod === "addPayment" ? "border-primary" : "border-input"}`}>
            <RadioGroupItem value="addPayment" id="addPayment" className="mr-3" />
            <Label htmlFor="addPayment" className="flex-1 flex items-center cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Payment Method</span>
            </Label>
          </div>
        </RadioGroup>
        
        <Button 
          onClick={handleContinue}
          className="w-full bg-primary text-black hover:bg-yellow-500"
        >
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
