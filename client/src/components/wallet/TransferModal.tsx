import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferSchema, TransferData } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";

export default function TransferModal() {
  const { isTransferModalOpen, closeTransferModal, transferFunds, processing } = useWallet();

  const form = useForm<TransferData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      recipientEmail: "",
      description: "",
    },
  });

  const onSubmit = async (data: TransferData) => {
    try {
      await transferFunds(data.amount, data.recipientEmail, data.description);
    } catch (error) {
      console.error("Transfer error:", error);
    }
  };

  return (
    <Dialog open={isTransferModalOpen} onOpenChange={closeTransferModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Funds</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="recipient@example.com" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                        placeholder="5,000.00"
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
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a note about this transfer" 
                      className="resize-none h-24"
                      {...field}
                    />
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
              {processing ? "Processing..." : "Transfer"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
