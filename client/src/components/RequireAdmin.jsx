import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAdminAuth } from '../context/AdminAuthContext';

export function RequireAdmin({ children }) {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace state={{ from: location.pathname }} />;
  }

  return children;
}
