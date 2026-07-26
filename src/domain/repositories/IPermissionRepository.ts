import { UserRole, ResourcePermission, UserAccount, PlanId } from '../types/auth';

export interface IPermissionRepository {
  getUserPermissions(user: UserAccount): Promise<Record<ResourcePermission, boolean>>;
  hasPermission(user: UserAccount | null, permission: ResourcePermission): Promise<boolean>;
  hasRole(user: UserAccount | null, roles: UserRole | UserRole[]): Promise<boolean>;
  canAccessModule(user: UserAccount | null, moduleId: string): Promise<boolean>;
  canAccessWithPlan(user: UserAccount | null, planId: PlanId, requiredPermission: ResourcePermission): Promise<boolean>;
}
