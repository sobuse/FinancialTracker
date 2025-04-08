import { Switch, Route, useLocation } from "wouter";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./hooks/use-theme";
import { AuthProvider } from "./contexts/AuthContext";
import { WalletProvider } from "./contexts/WalletContext";

function App() {
  const [location] = useLocation();
  
  return (
    <ThemeProvider defaultTheme="light" storageKey="credpal-theme">
      <AuthProvider>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/dashboard">
            <WalletProvider>
              <Dashboard />
            </WalletProvider>
          </Route>
          <Route path="/">
            <Login />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
