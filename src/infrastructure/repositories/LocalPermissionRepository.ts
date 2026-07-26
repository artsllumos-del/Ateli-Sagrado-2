import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { UserAccount, UserRole, ResourcePermission, PlanId } from '../../domain/types/auth';

const ROLE_PERMISSIONS: Record<UserRole, ResourcePermission[]> = {
  admin: [
    'dashboard:read', 'inventory:read', 'inventory:write', 'purchases:read', 'purchases:write',
    'products:read', 'products:write', 'pricing:read', 'pricing:write', 'clients:read', 'clients:write',
    'quotes:read', 'quotes:write', 'orders:read', 'orders:write', 'production:read', 'production:write',
    'financial:read', 'financial:write', 'users:manage', 'settings:manage', 'subscription:manage', 'audit:read'
  ],
  moderator: [
    'dashboard:read', 'inventory:read', 'inventory:write', 'purchases:read', 'purchases:write',
    'products:read', 'products:write', 'pricing:read', 'pricing:write', 'clients:read', 'clients:write',
    'quotes:read', 'quotes:write', 'orders:read', 'orders:write', 'production:read', 'production:write',
    'financial:read', 'financial:write', 'audit:read'
  ],
  authenticated: [
    'dashboard:read', 'inventory:read', 'inventory:write', 'purchases:read', 'purchases:write',
    'products:read', 'products:write', 'pricing:read', 'clients:read', 'clients:write',
    'quotes:read', 'quotes:write', 'orders:read', 'orders:write', 'production:read', 'production:write'
  ],
  client: [
    'dashboard:read', 'products:read', 'quotes:read', 'quotes:write', 'orders:read'
  ],
  visitor: [
    'products:read'
  ]
};

export class LocalPermissionRepository implements IPermissionRepository {
  async getUserPermissions(user: UserAccount): Promise<Record<ResourcePermission, boolean>> {
    const defaultPerms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS['authenticated'];
    const permMap: Partial<Record<ResourcePermission, boolean>> = {};

    const allPermKeys: ResourcePermission[] = [
      'dashboard:read', 'inventory:read', 'inventory:write', 'purchases:read', 'purchases:write',
      'products:read', 'products:write', 'pricing:read', 'pricing:write', 'clients:read', 'clients:write',
      'quotes:read', 'quotes:write', 'orders:read', 'orders:write', 'production:read', 'production:write',
      'financial:read', 'financial:write', 'users:manage', 'settings:manage', 'subscription:manage', 'audit:read'
    ];

    allPermKeys.forEach(k => {
      // Custom overrides if present
      if (user.customPermissions && user.customPermissions[k] !== undefined) {
        permMap[k] = user.customPermissions[k];
      } else {
        permMap[k] = defaultPerms.includes(k);
      }
    });

    return permMap as Record<ResourcePermission, boolean>;
  }

  async hasPermission(user: UserAccount | null, permission: ResourcePermission): Promise<boolean> {
    if (!user) return permission === 'products:read';
    if (user.role === 'admin') return true;

    const perms = await this.getUserPermissions(user);
    return Boolean(perms[permission]);
  }

  async hasRole(user: UserAccount | null, roles: UserRole | UserRole[]): Promise<boolean> {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  }

  async canAccessModule(user: UserAccount | null, moduleId: string): Promise<boolean> {
    if (!user) return moduleId === 'products';
    if (user.role === 'admin') return true;

    const moduleToPermMap: Record<string, ResourcePermission> = {
      dashboard: 'dashboard:read',
      inventory: 'inventory:read',
      purchases: 'purchases:read',
      products: 'products:read',
      pricing: 'pricing:read',
      clients: 'clients:read',
      quotes: 'quotes:read',
      orders: 'orders:read',
      production: 'production:read',
      financial: 'financial:read',
      users: 'users:manage',
      settings: 'settings:manage',
      subscription: 'subscription:manage',
    };

    const perm = moduleToPermMap[moduleId];
    if (!perm) return true;
    return this.hasPermission(user, perm);
  }

  async canAccessWithPlan(user: UserAccount | null, planId: PlanId, requiredPermission: ResourcePermission): Promise<boolean> {
    return this.hasPermission(user, requiredPermission);
  }
}
