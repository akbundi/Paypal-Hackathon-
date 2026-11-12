import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import type { ReactNode } from 'react';

import { PayGuardProvider, usePayGuard } from './context/PayGuardContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import { TopNav } from './components/layout/TopNav';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/layout/ToastContainer';
import { APP_CONTAINER_CLASS } from './constants/layout';

import { Dashboard } from './pages/Dashboard';
import { ScamDetection } from './pages/ScamDetection';
import { SpendingGuard } from './pages/SpendingGuard';
import { TrustedCircle } from './pages/TrustedCircle';
import { Transactions } from './pages/Transactions';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

import { TransactionDetailModal } from './components/transactions/TransactionDetailModal';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060B18]">
    <div className="text-sm text-slate-500 dark:text-slate-400">
      Checking your session...
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const GuestRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { activeTab, selectedTransaction, setSelectedTransaction } = usePayGuard();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <Dashboard />;
      case 'scam-detection':
        return <ScamDetection />;
      case 'spending-guard':
        return <SpendingGuard />;
      case 'trusted-circle':
        return <TrustedCircle />;
      case 'transactions':
        return <Transactions />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-slate-50 dark:bg-[#060B18] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <TopNav />

      <main className={`flex-1 ${APP_CONTAINER_CLASS} py-6 md:py-8 animate-in fade-in duration-200`}>
        {renderActivePage()}
      </main>

      <Footer />

      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      <ToastContainer />
    </div>
  );
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <GuestRoute>
          <Login />
        </GuestRoute>
      }
    />

    <Route
      path="/signup"
      element={
        <GuestRoute>
          <Signup />
        </GuestRoute>
      }
    />

    <Route
      path="/"
      element={
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PayGuardProvider>
          <AppRoutes />
        </PayGuardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
