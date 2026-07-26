import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserAccount, UserRole, ResourcePermission } from '../../domain/types/auth';

const STORAGE_KEY = 'as_user_accounts';

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user_admin',
    email: 'admin@atelie.com',
    username: 'Admin',
    name: 'Administrador Master',
    role: 'admin',
    roleLabel: 'Administrador Master',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
    phone: '(11) 99999-8888',
    companyName: 'Ateliê Sagrado',
    emailVerified: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date().toISOString(),
    twoFactorEnabled: false
  },
  {
    id: 'user_rosana',
    email: 'rosana@atelie.com',
    username: 'Rosana',
    name: 'Rosana Santos',
    role: 'authenticated',
    roleLabel: 'Vendedor / Comercial',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    phone: '(11) 98888-7777',
    companyName: 'Ateliê Sagrado',
    emailVerified: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    twoFactorEnabled: false
  }
];

export class LocalUserRepository implements IUserRepository {
  private getUsers(): UserAccount[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  }

  private saveUsers(users: UserAccount[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  async getById(id: string): Promise<UserAccount | null> {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  async getByEmail(email: string): Promise<UserAccount | null> {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getAll(): Promise<UserAccount[]> {
    return this.getUsers();
  }

  async updateProfile(id: string, data: Partial<UserAccount>): Promise<UserAccount> {
    const users = this.getUsers();
    let updated: UserAccount | null = null;
    const next = users.map(u => {
      if (u.id === id) {
        updated = { ...u, ...data };
        return updated;
      }
      return u;
    });

    if (!updated) {
      throw new Error('Usuário não encontrado');
    }

    this.saveUsers(next);
    return updated;
  }

  async createUser(data: Omit<UserAccount, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<UserAccount> {
    const users = this.getUsers();
    const newUser: UserAccount = {
      ...data,
      id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    if (id === 'user_admin') {
      throw new Error('Não é possível excluir o Administrador Master');
    }
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    this.saveUsers(filtered);
    return true;
  }

  async toggleUserStatus(id: string, active: boolean): Promise<UserAccount> {
    const user = await this.getById(id);
    if (!user) throw new Error('Usuário não encontrado');
    return this.updateProfile(id, { emailVerified: active });
  }

  async updateRole(id: string, role: UserRole, roleLabel: string): Promise<UserAccount> {
    return this.updateProfile(id, { role, roleLabel });
  }

  async updateCustomPermissions(id: string, permissions: Record<ResourcePermission, boolean>): Promise<UserAccount> {
    return this.updateProfile(id, { customPermissions: permissions });
  }
}
