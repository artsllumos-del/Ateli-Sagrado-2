import { UserAccount, UserRole, ResourcePermission } from '../types/auth';

export interface IUserRepository {
  getById(id: string): Promise<UserAccount | null>;
  getByEmail(email: string): Promise<UserAccount | null>;
  getAll(): Promise<UserAccount[]>;
  updateProfile(id: string, data: Partial<UserAccount>): Promise<UserAccount>;
  createUser(data: Omit<UserAccount, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<UserAccount>;
  deleteUser(id: string): Promise<boolean>;
  toggleUserStatus(id: string, active: boolean): Promise<UserAccount>;
  updateRole(id: string, role: UserRole, roleLabel: string): Promise<UserAccount>;
  updateCustomPermissions(id: string, permissions: Record<ResourcePermission, boolean>): Promise<UserAccount>;
}
