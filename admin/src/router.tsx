import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import Users from '@/pages/Users';
import RouteList from '@/pages/routes/RouteList';
import CreateRoute from '@/pages/routes/CreateRoute';
import JourneyPlans from '@/pages/JourneyPlans';
import { PROTECTED_ROUTES, UNPROTECTED_ROUTES } from '@/constants/routes';

export const router = createBrowserRouter([
  {
    path: UNPROTECTED_ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: PROTECTED_ROUTES.DASHBOARD,
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: PROTECTED_ROUTES.CUSTOMERS,
    element: <ProtectedRoute><Customers /></ProtectedRoute>,
  },
  {
    path: PROTECTED_ROUTES.USERS,
    element: <ProtectedRoute><Users /></ProtectedRoute>,
  },
  {
    path: PROTECTED_ROUTES.ROUTES,
    element: <ProtectedRoute><RouteList /></ProtectedRoute>,
  },
  {
    path: PROTECTED_ROUTES.ROUTES_NEW,
    element: <ProtectedRoute><CreateRoute /></ProtectedRoute>,
  },
  {
    path: PROTECTED_ROUTES.JOURNEY_PLANS,
    element: <ProtectedRoute><JourneyPlans /></ProtectedRoute>,
  },
]);
