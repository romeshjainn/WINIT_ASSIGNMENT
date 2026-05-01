import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';
import { UNPROTECTED_ROUTES } from '@/constants/routes';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={UNPROTECTED_ROUTES.LOGIN} replace />;
  if (user?.role !== ROLES.ADMIN) return <Navigate to={UNPROTECTED_ROUTES.LOGIN} replace />;
  return <>{children}</>;
}
