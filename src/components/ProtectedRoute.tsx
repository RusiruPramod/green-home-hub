import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("superadmin" | "hotelAdmin")[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Temporary bypass for development: If no user, redirect to login
  // Since we haven't created users yet, we might want to bypass auth for testing,
  // but for the final version this must be strictly enforced.
  if (!currentUser && import.meta.env.PROD) {
     return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!currentUser && import.meta.env.DEV) {
      // In dev mode, if we haven't logged in, we might just bypass for now, 
      // but let's strictly enforce it to properly test Auth.
      return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // If user doesn't have the required role, redirect them to their respective default dashboard
    if (userRole === "superadmin") {
      return <Navigate to="/superadmin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
