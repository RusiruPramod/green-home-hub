import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Water from "./pages/Water";
import Control from "./pages/Control";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import TariffSettings from "./pages/TariffSettings";
import Evaluation from "./pages/Evaluation";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

// Super Admin Pages
import SuperAdminOverview from "./pages/superadmin/Overview";
import GlobalTariffs from "./pages/superadmin/GlobalTariffs";
import Hotels from "./pages/superadmin/Hotels";
import AggregateAnalytics from "./pages/superadmin/AggregateAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Hotel Admin Routes (Protected) */}
            <Route path="/" element={<ProtectedRoute allowedRoles={["hotelAdmin", "superadmin"]}><Index /></ProtectedRoute>} />
            <Route path="/water" element={<ProtectedRoute allowedRoles={["hotelAdmin", "superadmin"]}><Water /></ProtectedRoute>} />
            <Route path="/control" element={<ProtectedRoute allowedRoles={["hotelAdmin", "superadmin"]}><Control /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute allowedRoles={["hotelAdmin", "superadmin"]}><Alerts /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={["hotelAdmin", "superadmin"]}><Analytics /></ProtectedRoute>} />
            <Route path="/evaluation" element={<ProtectedRoute allowedRoles={["hotelAdmin", "superadmin"]}><Evaluation /></ProtectedRoute>} />
            <Route path="/settings/tariffs" element={<ProtectedRoute allowedRoles={["hotelAdmin", "superadmin"]}><TariffSettings /></ProtectedRoute>} />
            
            {/* Super Admin Routes (Protected) */}
            <Route path="/superadmin" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperAdminOverview /></ProtectedRoute>} />
            <Route path="/superadmin/hotels" element={<ProtectedRoute allowedRoles={["superadmin"]}><Hotels /></ProtectedRoute>} />
            <Route path="/superadmin/tariffs" element={<ProtectedRoute allowedRoles={["superadmin"]}><GlobalTariffs /></ProtectedRoute>} />
            <Route path="/superadmin/analytics" element={<ProtectedRoute allowedRoles={["superadmin"]}><AggregateAnalytics /></ProtectedRoute>} />

            {/* Fallbacks */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
