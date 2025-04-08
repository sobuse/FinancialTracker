# CredPal - Fintech Application

A full-stack fintech application with user authentication, wallet management, and transaction capabilities using React, TypeScript, and Express.

## Features

- User authentication (register, login, logout)
- Wallet management (balance view, fund, withdraw, transfer)
- Transaction history
- PostgreSQL database integration
- Responsive design

## Tech Stack

### Frontend
- React with TypeScript
- TanStack Query for data fetching
- Zod for form validation
- Tailwind CSS with shadcn/ui components
- React Hook Form

### Backend
- Express.js server
- PostgreSQL database with Drizzle ORM
- JWT authentication
- RESTful API

## Getting Started

### Prerequisites
- Node.js
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/credpal.git
cd credpal
```

2. Install dependencies
```bash
npm install
```

3. Set up your environment variables in `.env` file
```
DATABASE_URL=postgresql://username:password@localhost:5432/credpal
JWT_SECRET=your_jwt_secret_key
```

4. Run the database migrations
```bash
npm run db:push
```

5. Start the application
```bash
npm run dev
```

## API Endpoints

- **Authentication**
  - POST `/api/auth/register` - Register a new user
  - POST `/api/auth/login` - Login existing user
  - GET `/api/users/me` - Get current user profile

- **Wallet Management**
  - GET `/api/wallet/balance` - Get wallet balance
  - POST `/api/wallet/fund` - Fund wallet
  - POST `/api/wallet/withdraw` - Withdraw from wallet
  - POST `/api/wallet/transfer` - Transfer funds to another user

- **Transactions**
  - GET `/api/transactions` - Get user transactions

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express server
- `/shared` - Shared types and schemas