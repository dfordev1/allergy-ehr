import React from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  children,
  fallback = null,
  showError = false,
}) => {
  const { hasPermission, loading } = useRBAC();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasAccess = hasPermission(resource, action);

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to {action} {resource}. Contact your administrator for access.
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  children,
  fallback = null,
  showError = false,
}) => {
  const { role, loading } = useRBAC();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasRole = role && roles.includes(role.name);

  if (!hasRole) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access restricted to: {roles.join(', ')}. Contact your administrator for access.
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};