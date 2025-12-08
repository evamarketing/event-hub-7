import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useStallAuth } from "@/contexts/StallAuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { stall, isLoading } = useStallAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stall) {
    return <Navigate to="/stall-login" replace />;
  }

  return <>{children}</>;
}
