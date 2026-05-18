import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layouts/AppLayout';
import AuthLayout from '../components/layouts/AuthLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import DashboardPage from '../pages/Dashboard';
import InvestigationsPage from '../pages/Investigations';
import InvestigationReportPage from '../pages/InvestigationReport';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/investigations', element: <InvestigationsPage /> },
          { path: '/investigations/:id', element: <InvestigationReportPage /> },
        ],
      },
    ],
  },
]);
