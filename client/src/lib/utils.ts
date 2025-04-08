import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function generateTransactionStatus(status: string) {
  const statusColors = {
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-orange-100 text-orange-800',
    rejected: 'bg-red-100 text-red-800',
    liquidated: 'bg-orange-100 text-orange-800',
  };
  
  const dotColors = {
    approved: 'bg-green-600',
    pending: 'bg-orange-500',
    rejected: 'bg-red-600',
    liquidated: 'bg-orange-500',
  };
  
  const statusKey = status.toLowerCase() as keyof typeof statusColors;
  const bgColor = statusColors[statusKey] || 'bg-gray-100 text-gray-800';
  const dotColor = dotColors[statusKey] || 'bg-gray-500';
  
  return { bgColor, dotColor };
}

// Function to obscure email
export function obscureEmail(email: string): string {
  const [username, domain] = email.split('@');
  const obscuredUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${obscuredUsername}@${domain}`;
}

// Function to obscure account number
export function obscureAccountNumber(account: string): string {
  if (!account || account.length < 6) return account;
  return '**' + account.slice(-6);
}

// Function to generate pagination pages
export function generatePaginationPages(currentPage: number, totalPages: number): number[] {
  const pages: number[] = [];
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push(-1); // Ellipsis
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push(-1); // Ellipsis
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push(-1); // Ellipsis
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push(-1); // Ellipsis
      pages.push(totalPages);
    }
  }
  
  return pages;
}
