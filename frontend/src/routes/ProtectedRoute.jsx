import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// Wraps routes that require login
// If not logged in → redirect to /login
// Saves the attempted URL so we can redirect back after login
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }} // Remember where they were going
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;