import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useStallAuth } from "@/contexts/StallAuthContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { stall, isLoading: stallLoading } = useStallAuth();
  const { admin, isLoading: adminLoading } = useAdminAuth();

  if (stallLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow access if either stall or admin is authenticated
  if (!stall && !admin) {
    return <Navigate to="/stall-login" replace />;
  }

  return <>{children}</>;
}
