import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../features/store';
import { isTokenExpired } from '../../utils/jwt';

/**
 * PrivateRoute Component
 * Protects routes from unauthenticated access
 * Redirects to login if user is not authenticated or token is expired
 */
const PrivateRoute = () => {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);

  // Check if user is authenticated and token is valid
  if (!isAuthenticated || !token || isTokenExpired(token)) {
    // Redirect to login if not authenticated or token expired
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default PrivateRoute;
