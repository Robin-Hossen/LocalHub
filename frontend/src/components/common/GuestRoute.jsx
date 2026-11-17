import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function GuestRoute({ children }) {
  const { isAuthenticated, isLoadingUser, user, canAccessAdmin } = useAuth();

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated && user?.role) {
    if (canAccessAdmin) {
      return <Navigate to="/admin" replace />;
    }

    if (user.role === "DELIVERY") {
      return <Navigate to="/delivery" replace />;
    }

    if (user.role === "CUSTOMER") {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default GuestRoute;
