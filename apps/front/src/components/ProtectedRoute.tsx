import { Navigate, Outlet } from 'react-router-dom';
import { authStore } from '../store/authStore';

const ProtectedRoute = () => {
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
