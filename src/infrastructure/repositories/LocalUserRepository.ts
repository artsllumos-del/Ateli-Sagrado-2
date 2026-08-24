import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserAccount, UserRole, ResourcePermission } from '../../domain/types/auth';

const STORAGE_KEY = 'as_user_accounts';

const INITIAL_USERS: UserAccount[] = [
  // --- ATELIÊ 1: ATELIÊ SAGRADO ---
  {
    id: 'user_admin',
    tenantId: 'tenant_atelie_sagrado',
    activeTenantId: 'tenant_atelie_sagrado',
    tenants: [
      {
        tenantId: 'tenant_atelie_sagrado',
        tenantName: 'Ateliê Sagrado',
        tenantSlug: 'atelie-sagrado',
        role: 'admin',
        roleLabel: 'Administrador Titular',
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    email: 'admin@atelie.com',
    username: 'Admin',
    name: 'Administrador (Ateliê Sagrado)',
    role: 'admin',
    roleLabel: 'Administrador Titular',
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
    tenantId: 'tenant_atelie_sagrado',
    activeTenantId: 'tenant_atelie_sagrado',
    tenants: [
      {
        tenantId: 'tenant_atelie_sagrado',
        tenantName: 'Ateliê Sagrado',
        tenantSlug: 'atelie-sagrado',
        role: 'authenticated',
        roleLabel: 'Vendedora / Comercial',
        joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    email: 'rosana@atelie.com',
    username: 'Rosana',
    name: 'Rosana Santos',
    role: 'authenticated',
    roleLabel: 'Vendedora / Comercial',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    phone: '(11) 98888-7777',
    companyName: 'Ateliê Sagrado',
    emailVerified: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    twoFactorEnabled: false
  },
  {
    id: 'user_lucas',
    tenantId: 'tenant_atelie_sagrado',
    activeTenantId: 'tenant_atelie_sagrado',
    tenants: [
      {
        tenantId: 'tenant_atelie_sagrado',
        tenantName: 'Ateliê Sagrado',
        tenantSlug: 'atelie-sagrado',
        role: 'authenticated',
        roleLabel: 'Artesão / Chão de Fábrica',
        joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    email: 'lucas@atelie.com',
    username: 'Lucas',
    name: 'Lucas Silva',
    role: 'authenticated',
    roleLabel: 'Artesão / Chão de Fábrica',
    photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150&auto=format&fit=crop',
    phone: '(11) 97777-6666',
    companyName: 'Ateliê Sagrado',
    emailVerified: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    twoFactorEnabled: false
  },
  {
    id: 'user_marcos',
    tenantId: 'tenant_atelie_sagrado',
    activeTenantId: 'tenant_atelie_sagrado',
    tenants: [
      {
        tenantId: 'tenant_atelie_sagrado',
        tenantName: 'Ateliê Sagrado',
        tenantSlug: 'atelie-sagrado',
        role: 'authenticated',
        roleLabel: 'Almoxarife / Estoquista',
        joinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    email: 'marcos@atelie.com',
    username: 'Marcos',
    name: 'Marcos Lima',
    role: 'authenticated',
    roleLabel: 'Almoxarife / Estoquista',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    phone: '(11) 96666-5555',
    companyName: 'Ateliê Sagrado',
    emailVerified: true,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    twoFactorEnabled: false
  },

  // --- ATELIÊ 2: STUDIO LUZ DIVINA ---
  {
    id: 'user_admin_luz',
    tenantId: 'tenant_luz_divina',
    activeTenantId: 'tenant_luz_divina',
    tenants: [
      {
        tenantId: 'tenant_luz_divina',
        tenantName: 'Studio Luz Divina',
        tenantSlug: 'luz-divina',
        role: 'admin',
        roleLabel: 'Administrador Titular',
        joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    email: 'admin@luzdivina.com',
    username: 'AdminLuz',
    name: 'Administrador (Studio Luz Divina)',
    role: 'admin',
    roleLabel: 'Administrador Titular',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop',
    phone: '(21) 98888-7777',
    companyName: 'Studio Luz Divina',
    emailVerified: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date().toISOString(),
    twoFactorEnabled: false
  },
  {
    id: 'user_carlos_luz',
    tenantId: 'tenant_luz_divina',
    activeTenantId: 'tenant_luz_divina',
    tenants: [
      {
        tenantId: 'tenant_luz_divina',
        tenantName: 'Studio Luz Divina',
        tenantSlug: 'luz-divina',
        role: 'authenticated',
        roleLabel: 'Vendedor / Comercial',
        joinedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    email: 'carlos@luzdivina.com',
    username: 'CarlosLuz',
    name: 'Carlos Mendonça',
    role: 'authenticated',
    roleLabel: 'Vendedor / Comercial',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
    phone: '(21) 97777-1111',
    companyName: 'Studio Luz Divina',
    emailVerified: true,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    twoFactorEnabled: false
  },
  {
    id: 'user_mariana_luz',
    tenantId: 'tenant_luz_divina',
    activeTenantId: 'tenant_luz_divina',
    tenants: [
      {
        tenantId: 'tenant_luz_divina',
        tenantName: 'Studio Luz Divina',
        tenantSlug: 'luz-divina',
        role: 'authenticated',
        roleLabel: 'Artesã / Chão de Fábrica',
        joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    email: 'mariana@luzdivina.com',
    username: 'MarianaLuz',
    name: 'Mariana Costa',
    role: 'authenticated',
    roleLabel: 'Artesã / Chão de Fábrica',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    phone: '(21) 96666-2222',
    companyName: 'Studio Luz Divina',
    emailVerified: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
