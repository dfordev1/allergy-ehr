import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { RBACProvider } from "./components/providers/RBACProvider";
import { AuthForm } from "./components/auth/AuthForm";
import { Dashboard } from "./pages/Dashboard";
import { PatientDetail } from "./pages/PatientDetail";
import { BookingPage } from "./pages/BookingPage";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { 
  CriticalErrorBoundary, 
  PageErrorBoundary, 
  AsyncErrorBoundary 
} from "./components/errors/ErrorBoundary";

// Configure React Query with optimal settings for medical application
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <AsyncErrorBoundary>
      <RBACProvider>
        <Routes>
          <Route path="/" element={
            <PageErrorBoundary pageName="Dashboard">
              <Dashboard />
            </PageErrorBoundary>
          } />
          <Route path="/patient/:id" element={
            <PageErrorBoundary pageName="Patient Detail">
              <PatientDetail />
            </PageErrorBoundary>
          } />
          <Route path="/bookings" element={
            <PageErrorBoundary pageName="Bookings">
              <BookingPage />
            </PageErrorBoundary>
          } />
          <Route path="/analytics" element={
            <PageErrorBoundary pageName="Analytics">
              <Analytics />
            </PageErrorBoundary>
          } />
          <Route path="/settings" element={
            <PageErrorBoundary pageName="Settings">
              <Settings />
            </PageErrorBoundary>
          } />
          <Route path="*" element={
            <PageErrorBoundary pageName="Not Found">
              <Dashboard />
            </PageErrorBoundary>
          } />
        </Routes>
      </RBACProvider>
    </AsyncErrorBoundary>
  );
};

const App = () => (
  <CriticalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
        {/* React Query Devtools - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  </CriticalErrorBoundary>
);

export default App;
