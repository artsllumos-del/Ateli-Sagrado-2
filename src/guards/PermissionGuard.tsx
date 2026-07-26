import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { ResourcePermission, UserRole } from '../domain/types/auth';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: ResourcePermission;
  roles?: UserRole | UserRole[];
  moduleId?: string;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  roles,
  moduleId,
  fallback
}) => {
  const { hasPermission, hasRole, canAccessModule } = usePermissions();

  if (permission && !hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  if (roles && !hasRole(roles)) {
    return fallback ? <>{fallback}</> : null;
  }

  if (moduleId && !canAccessModule(moduleId)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
