import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// Wraps routes that require a specific role
// Usage: <RoleRoute role="admin"> or <RoleRoute role="vendor">
const RoleRoute = ({ children, role }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== role) {
    // Logged in but wrong role — redirect to homepage
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;