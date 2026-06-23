import { Navigate, createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layouts/AppLayout';
import AuthLayout from '../components/layouts/AuthLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import ErrorPage from '../pages/ErrorPage';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import DashboardPage from '../pages/Dashboard';
import InvestigationsPage from '../pages/Investigations';
import InvestigationReportPage from '../pages/InvestigationReport';
import ProfilePage from '../pages/Profile';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/login',    element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <ErrorPage />,
        children: [
          { path: '/',                      element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard',             element: <DashboardPage /> },
          { path: '/investigations',        element: <InvestigationsPage /> },
          { path: '/investigations/:id',    element: <InvestigationReportPage /> },
          { path: '/profile',               element: <ProfilePage /> },
          { path: '*',                      element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);
