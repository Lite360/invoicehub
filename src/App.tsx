import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Auth & Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages - Public
import LandingPage from './pages/public/LandingPage';
import Pricing from './pages/public/Pricing';
import PayPage from './pages/public/PayPage';

// Pages - Auth
import AuthPage from './pages/auth/AuthPage';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Pages - Setup
import CompanySetupWizard from './pages/setup/CompanySetupWizard';

// Pages - App
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/app/Dashboard';
import InvoiceList from './pages/app/invoices/InvoiceList';
import InvoiceForm from './pages/app/invoices/InvoiceForm';
import InvoiceDetail from './pages/app/invoices/InvoiceDetail';
import QuotationList from './pages/app/quotations/QuotationList';
import QuotationForm from './pages/app/quotations/QuotationForm';
import QuotationDetail from './pages/app/quotations/QuotationDetail';
import ReceiptList from './pages/app/receipts/ReceiptList';
import ReceiptForm from './pages/app/receipts/ReceiptForm';
import ReceiptDetail from './pages/app/receipts/ReceiptDetail';
import LetterList from './pages/app/letters/LetterList';
import LetterForm from './pages/app/letters/LetterForm';
import LetterDetail from './pages/app/letters/LetterDetail';
import CustomerList from './pages/app/customers/CustomerList';
import CustomerForm from './pages/app/customers/CustomerForm';
import CustomerDetail from './pages/app/customers/CustomerDetail';
import SettingsPage from './pages/app/settings/SettingsPage';
import PaymentList from './pages/app/payments/PaymentList';
import PaymentForm from './pages/app/payments/PaymentForm';
import HistoryPage from './pages/app/history/HistoryPage';
import SubscriptionPage from './pages/app/subscription/SubscriptionPage';

// Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBusinesses from './pages/admin/AdminBusinesses';
import AdminPlans from './pages/admin/AdminPlans';
import AdminPayments from './pages/admin/AdminPayments';

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/pay/:id" element={<PayPage />} />

              {/* Setup route (auth required, but no business required yet) */}
              <Route element={<ProtectedRoute requireBusiness={false} />}>
                <Route path="/setup" element={<CompanySetupWizard />} />
              </Route>

              {/* Protected app routes (requires both auth and completed setup) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/app/dashboard" element={<Dashboard />} />
                  <Route path="/app/invoices" element={<InvoiceList />} />
                  <Route path="/app/invoices/new" element={<InvoiceForm />} />
                  <Route path="/app/invoices/:id" element={<InvoiceDetail />} />
                  <Route path="/app/invoices/:id/edit" element={<InvoiceForm />} />
                  <Route path="/app/quotations" element={<QuotationList />} />
                  <Route path="/app/quotations/new" element={<QuotationForm />} />
                  <Route path="/app/quotations/:id" element={<QuotationDetail />} />
                  <Route path="/app/quotations/:id/edit" element={<QuotationForm />} />
                  <Route path="/app/receipts" element={<ReceiptList />} />
                  <Route path="/app/receipts/new" element={<ReceiptForm />} />
                  <Route path="/app/receipts/:id" element={<ReceiptDetail />} />
                  <Route path="/app/receipts/:id/edit" element={<ReceiptForm />} />
                  <Route path="/app/letters" element={<LetterList />} />
                  <Route path="/app/letters/new" element={<LetterForm />} />
                  <Route path="/app/letters/:id" element={<LetterDetail />} />
                  <Route path="/app/letters/:id/edit" element={<LetterForm />} />
                  <Route path="/app/customers" element={<CustomerList />} />
                  <Route path="/app/customers/new" element={<CustomerForm />} />
                  <Route path="/app/customers/:id" element={<CustomerDetail />} />
                  <Route path="/app/customers/:id/edit" element={<CustomerForm />} />
                  <Route path="/app/payments" element={<PaymentList />} />
                  <Route path="/app/payments/new" element={<PaymentForm />} />
                  <Route path="/app/history" element={<HistoryPage />} />
                  <Route path="/app/subscription" element={<SubscriptionPage />} />
                  <Route path="/app/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Admin routes */}
              <Route element={<ProtectedRoute requireBusiness={false} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/businesses" element={<AdminBusinesses />} />
                  <Route path="/admin/plans" element={<AdminPlans />} />
                  <Route path="/admin/payments" element={<AdminPayments />} />
                  <Route path="/admin/settings" element={<AdminDashboard />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
