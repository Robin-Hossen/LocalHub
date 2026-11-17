
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function DeliveryRoute({ children }) {
  const { isAuthenticated, isLoadingUser, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Checking permissions...</p>
      </div>
    );
  }

  if (user?.role !== "DELIVERY") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default DeliveryRoute;
