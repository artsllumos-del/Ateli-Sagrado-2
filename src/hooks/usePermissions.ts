import { useAuthContext } from '../context/AuthContext';
import { ResourcePermission, UserRole } from '../domain/types/auth';

export const usePermissions = () => {
  const { permissions, user, hasPermission, hasRole, canAccessModule } = useAuthContext();

  return {
    permissions,
    userRole: user?.role || 'visitor',
    hasPermission: (perm: ResourcePermission) => hasPermission(perm),
    hasRole: (roles: UserRole | UserRole[]) => hasRole(roles),
    canAccessModule: (moduleId: string) => canAccessModule(moduleId)
  };
};
