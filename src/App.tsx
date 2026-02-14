import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./hooks/useAuth";
import HttpsRedirect from "./components/HttpsRedirect";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Dashboard from "./pages/Dashboard";
import ApplyVisa from "./pages/ApplyVisa";
import ViewApplication from "./pages/ViewApplication";
import BookVisa from "./pages/BookVisa";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentStatus from "./pages/PaymentStatus";
import PaymentCancel from "./pages/PaymentCancel";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RefundPolicy from "./pages/RefundPolicy";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminPricing from "./pages/admin/AdminPricing";
import AdminCountries from "./pages/admin/AdminCountries";
import AdminArrivalPoints from "./pages/admin/AdminArrivalPoints";
import NotFound from "./pages/NotFound";
import LeadCapturePopup from "./components/LeadCapturePopup";
import WhatsAppButton from "./components/WhatsAppButton";
import TrackingPixels from "./components/TrackingPixels";

// Create QueryClient ONCE outside React component to prevent re-creation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const RecoveryRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hasRecoveryInHash = location.hash?.includes("type=recovery");
    const hasRecoveryInSearch = location.search?.includes("type=recovery");

    if (hasRecoveryInHash || hasRecoveryInSearch) {
      navigate(
        {
          pathname: "/reset-password",
          search: location.search,
          hash: location.hash,
        },
        { replace: true }
      );
    }
  }, [location, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HttpsRedirect />
      <Toaster />
      <Sonner />
      <AuthProvider>
        <RecoveryRedirect />
        <TrackingPixels />
        <LeadCapturePopup />
        <WhatsAppButton />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/book-visa" element={<BookVisa />} />
            <Route path="/apply-visa" element={<ApplyVisa />} />
            <Route path="/application/:id" element={<ViewApplication />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
            <Route path="/admin/pricing" element={<AdminPricing />} />
            <Route path="/admin/countries" element={<AdminCountries />} />
            <Route path="/admin/arrival-points" element={<AdminArrivalPoints />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
