import { useWallet } from "@/contexts/WalletContext";
import { formatCurrency, formatDate, generateTransactionStatus, generatePaginationPages } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TransactionTable() {
  const {
    transactions,
    totalTransactions,
    currentPage,
    totalPages,
    loading,
    setPage
  } = useWallet();

  const paginationPages = generatePaginationPages(currentPage, totalPages);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6 animate-pulse">
            <div className="h-6 w-36 bg-muted rounded"></div>
            <div className="h-8 w-72 bg-muted rounded"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="w-full h-12 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <div className="flex items-center space-x-3">
            <Tabs defaultValue="history">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="3years">3 years</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Filter by</span>
              <Select defaultValue="spot">
                <SelectTrigger className="w-[90px] border-none">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spot">Spot</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left whitespace-nowrap py-3 px-2 text-sm font-medium text-muted-foreground">Transaction ID</th>
                <th className="text-left whitespace-nowrap py-3 px-2 text-sm font-medium text-muted-foreground">Transaction Type</th>
                <th className="text-left whitespace-nowrap py-3 px-2 text-sm font-medium text-muted-foreground">Amount (₦)</th>
                <th className="text-left whitespace-nowrap py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left whitespace-nowrap py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left whitespace-nowrap py-3 px-2 text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => {
                  const { bgColor, dotColor } = generateTransactionStatus(transaction.status);
                  
                  return (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 text-sm">{transaction.transactionId}</td>
                      <td className="py-3 px-2 text-sm capitalize">{transaction.type}</td>
                      <td className="py-3 px-2 text-sm">{formatCurrency(transaction.amount)}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${dotColor} mr-1`}></span>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm">{formatDate(transaction.createdAt)}</td>
                      <td className="py-3 px-2 text-sm">
                        <Button variant="ghost" className="text-primary hover:text-primary/80 px-2 h-auto py-1">View</Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalTransactions > 0 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(currentPage > 1 ? currentPage - 1 : 1)}
                disabled={currentPage === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              
              {paginationPages.map((page, index) => (
                page === -1 ? (
                  <span key={`ellipsis-${index}`} className="h-8 w-8 flex items-center justify-center">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    className={`h-8 w-8 ${currentPage === page ? 'bg-primary text-black hover:bg-yellow-500' : ''}`}
                    onClick={() => setPage(page)}
                  >
                    {page}
                  </Button>
                )
              ))}
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                disabled={currentPage === totalPages}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
