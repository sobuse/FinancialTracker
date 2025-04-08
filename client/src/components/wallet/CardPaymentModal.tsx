import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWallet } from "@/contexts/WalletContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

const cardPaymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{13,19}$/, "Card number must be between 13 and 19 digits"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Expiry date must be in MM/YY format"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
  amount: z.number().positive("Amount must be positive"),
});

type CardPaymentFormData = z.infer<typeof cardPaymentSchema>;

export default function CardPaymentModal() {
  const { isCardPaymentModalOpen, closeCardPaymentModal, fundWallet, processing } = useWallet();
  const [showCvv, setShowCvv] = useState(false);

  const form = useForm<CardPaymentFormData>({
    resolver: zodResolver(cardPaymentSchema),
    defaultValues: {
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      amount: 10000, // Default amount
    },
  });

  const onSubmit = async (data: CardPaymentFormData) => {
    try {
      await fundWallet(data.amount, "card");
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(" ");
    }
    return value;
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };

  return (
    <Dialog open={isCardPaymentModalOpen} onOpenChange={closeCardPaymentModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment details</DialogTitle>
        </DialogHeader>
        
        <p className="text-muted-foreground mb-4">Please confirm the payment details</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card details</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-between border rounded-md px-3">
                      <Input
                        type="text"
                        placeholder="5399 XXXX XXXX XXXX"
                        className="border-none pl-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field}
                        onChange={(e) => {
                          const formattedValue = formatCardNumber(e.target.value);
                          field.onChange(formattedValue);
                        }}
                        maxLength={19}
                      />
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" 
                        alt="Mastercard" 
                        className="h-8" 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry date</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        {...field}
                        onChange={(e) => {
                          const formattedValue = formatExpiryDate(e.target.value);
                          field.onChange(formattedValue);
                        }}
                        maxLength={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cvv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVV</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCvv ? "text" : "password"}
                          placeholder="546"
                          maxLength={4}
                          {...field}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowCvv(!showCvv)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        >
                          {showCvv ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-muted-foreground">₦</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="10,000.00"
                        className="pl-8"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-black hover:bg-yellow-500"
              disabled={processing}
            >
              {processing ? "Processing..." : "Pay Now"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
