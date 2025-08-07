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
import { SimpleBooking } from "./pages/SimpleBooking";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { AllergyPracticeDashboard } from "./pages/AllergyPracticeDashboard";
import { SkinTestModule } from "./pages/modules/SkinTestModule";
import { CustomAllergensModule } from "./pages/modules/CustomAllergensModule";
import { PatientHandoutsModule } from "./pages/modules/PatientHandoutsModule";
import { ContactlessCheckinModule } from "./pages/modules/ContactlessCheckinModule";
import { 
  CriticalErrorBoundary, 
  PageErrorBoundary, 
  AsyncErrorBoundary 
} from "./components/errors/ErrorBoundary";
import { ResilientErrorBoundary } from "./components/errors/ResilientErrorBoundary";

// Configure React Query with optimal settings for medical application
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors (client errors)
        const apiError = error as { status?: number };
        if (apiError?.status && apiError.status >= 400 && apiError.status < 500) {
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

  // TEMPORARILY BYPASSED FOR TESTING
  // if (!user) {
  //   return (
  //     <div className="min-h-screen bg-background">
  //       <div className="container mx-auto px-4 py-8">
  //         <div className="max-w-md mx-auto mb-6">
  //           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  //             <div className="flex items-center space-x-3">
  //               <div className="flex-shrink-0">
  //                 <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
  //                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  //                 </svg>
  //               </div>
  //               <div>
  //                 <h3 className="text-sm font-medium text-blue-800">Authentication Required</h3>
  //                 <p className="text-sm text-blue-700 mt-1">
  //                   Please sign in to access the Skin Track Aid booking system and patient records.
  //                 </p>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //         <AuthForm />
  //       </div>
  //     </div>
  //   );
  // }
  
  // TEMPORARY: Simulate authenticated user for testing
  const simulatedUser = user || { 
    id: 'temp-user-' + Date.now(), 
    email: 'temp@skintrack.com',
    aud: 'authenticated',
    role: 'authenticated'
  };

  return (
    <AsyncErrorBoundary>
      <RBACProvider user={simulatedUser}>
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
              <SimpleBooking />
            </PageErrorBoundary>
          } />
          <Route path="/old-bookings" element={
            <PageErrorBoundary pageName="Old Bookings">
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
                <Route path="/practice" element={
                  <PageErrorBoundary pageName="Allergy Practice">
                    <AllergyPracticeDashboard />
                  </PageErrorBoundary>
                } />
                <Route path="/practice/skin-tests" element={
                  <PageErrorBoundary pageName="Skin Test Module">
                    <SkinTestModule />
                  </PageErrorBoundary>
                } />
                <Route path="/practice/custom-allergens" element={
                  <PageErrorBoundary pageName="Custom Allergens Module">
                    <CustomAllergensModule />
                  </PageErrorBoundary>
                } />
                <Route path="/practice/handouts" element={
                  <PageErrorBoundary pageName="Patient Handouts Module">
                    <PatientHandoutsModule />
                  </PageErrorBoundary>
                } />
                <Route path="/practice/checkin" element={
                  <PageErrorBoundary pageName="Contactless Checkin Module">
                    <ContactlessCheckinModule />
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
