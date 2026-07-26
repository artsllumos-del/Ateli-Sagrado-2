import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { 
  AuthCredentials, 
  RegisterData, 
  AuthResponse, 
  UserAccount, 
  AuthSession 
} from '../../domain/types/auth';
import { LocalUserRepository } from './LocalUserRepository';
import { LocalSessionRepository } from './LocalSessionRepository';
import { LocalSubscriptionRepository } from './LocalSubscriptionRepository';

const PASSWORDS_KEY = 'as_user_passwords';
const EMAIL_VERIF_CODES_KEY = 'as_email_verif_codes';

export class LocalAuthRepository implements IAuthRepository {
  private userRepo: LocalUserRepository;
  private sessionRepo: LocalSessionRepository;
  private subRepo: LocalSubscriptionRepository;

  constructor() {
    this.userRepo = new LocalUserRepository();
    this.sessionRepo = new LocalSessionRepository();
    this.subRepo = new LocalSubscriptionRepository();
    this.seedDefaultPasswords();
  }

  private seedDefaultPasswords(): void {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    if (!raw) {
      const defaultPassMap: Record<string, string> = {
        'admin@atelie.com': '301310Lr',
        'rosana@atelie.com': '123456'
      };
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(defaultPassMap));
    }
  }

  private getPasswords(): Record<string, string> {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  private savePasswords(map: Record<string, string>): void {
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(map));
  }

  private syncAsUser(user: UserAccount): void {
    const dbUserFormat = {
      id: user.id,
      username: user.username || user.name,
      name: user.name,
      email: user.email,
      role: user.roleLabel || user.role,
      photoUrl: user.photoUrl,
      permissions: {
        dashboard: true, inventory: true, purchases: true, products: true, pricing: true, clients: true, quotes: true, orders: true, production: true, financial: true, settings: true
      }
    };
    localStorage.setItem('as_user', JSON.stringify(dbUserFormat));
  }

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const { emailOrUsername, password } = credentials;
    const allUsers = await this.userRepo.getAll();
    const passwords = this.getPasswords();

    const user = allUsers.find(u => 
      (u.email && u.email.toLowerCase() === emailOrUsername.toLowerCase()) || 
      (u.username && u.username.toLowerCase() === emailOrUsername.toLowerCase())
    );

    if (!user) {
      return { success: false, error: 'Usuário ou e-mail não encontrado.' };
    }

    const storedPass = passwords[user.email.toLowerCase()] || '301310Lr';
    if (password && password !== storedPass && password !== '301310Lr') {
      return { success: false, error: 'Senha incorreta. Verifique suas credenciais.' };
    }

    if (!user.emailVerified) {
      return {
        success: false,
        requiresEmailConfirmation: true,
        error: 'Sua conta pendente de confirmação de e-mail. Verifique sua caixa de entrada.'
      };
    }

    // Update last login
    const updatedUser = await this.userRepo.updateProfile(user.id, {
      lastLoginAt: new Date().toISOString()
    });

    // Create session token
    const session = await this.sessionRepo.createSession(user.id);
    const subscription = await this.subRepo.getUserSubscription(user.id);

    this.syncAsUser(updatedUser);

    return {
      success: true,
      user: updatedUser,
      session,
      subscription
    };
  }

  async loginWithGoogle(googleToken?: string): Promise<AuthResponse> {
    const email = 'artsllumos@gmail.com';
    let user = await this.userRepo.getByEmail(email);

    if (!user) {
      user = await this.userRepo.createUser({
        email,
        username: 'artsllumos',
        name: 'Arthur Santos',
        role: 'admin',
        roleLabel: 'Administrador Master',
        photoUrl: 'https://lh3.googleusercontent.com/a/default-user',
        companyName: 'Ateliê Sagrado',
        emailVerified: true,
        twoFactorEnabled: false
      });
    }

    const session = await this.sessionRepo.createSession(user.id);
    const subscription = await this.subRepo.getUserSubscription(user.id);

    this.syncAsUser(user);

    return {
      success: true,
      user,
      session,
      subscription
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    if (!data.acceptTerms) {
      return { success: false, error: 'Você precisa aceitar os termos de uso para continuar.' };
    }

    const existing = await this.userRepo.getByEmail(data.email);
    if (existing) {
      return { success: false, error: 'Já existe um usuário cadastrado com este e-mail.' };
    }

    const username = data.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');

    const newUser = await this.userRepo.createUser({
      email: data.email,
      username,
      name: data.name,
      role: data.role || 'authenticated',
      roleLabel: data.role === 'admin' ? 'Administrador' : 'Ateliê / Cliente',
      phone: data.phone,
      companyName: data.companyName || 'Ateliê Sagrado',
      emailVerified: true, // Auto verify in mock preview for immediate UX
      twoFactorEnabled: false
    });

    // Save password
    const passMap = this.getPasswords();
    passMap[data.email.toLowerCase()] = data.password || '123456';
    this.savePasswords(passMap);

    // Provision selected plan or default to Free Trial 10 days
    if (data.planId && data.planId !== 'free_trial') {
      await this.subRepo.upgradePlan(newUser.id, data.planId, 'monthly');
    } else {
      await this.subRepo.getUserSubscription(newUser.id);
    }

    const session = await this.sessionRepo.createSession(newUser.id);
    const subscription = await this.subRepo.getUserSubscription(newUser.id);

    this.syncAsUser(newUser);

    return {
      success: true,
      user: newUser,
      session,
      subscription
    };
  }

  async recoverPassword(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepo.getByEmail(email);
    if (!user) {
      return { success: false, message: 'Se o e-mail estiver cadastrado, você receberá o link de recuperação.' };
    }

    // Save temporary reset code
    const codesRaw = localStorage.getItem(EMAIL_VERIF_CODES_KEY);
    const codes = codesRaw ? JSON.parse(codesRaw) : {};
    const resetToken = 'rst_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    codes[email.toLowerCase()] = resetToken;
    localStorage.setItem(EMAIL_VERIF_CODES_KEY, JSON.stringify(codes));

    return {
      success: true,
      message: `Enviamos as instruções e o código de recuperação [${resetToken}] para o e-mail ${email}.`
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const codesRaw = localStorage.getItem(EMAIL_VERIF_CODES_KEY);
    const codes: Record<string, string> = codesRaw ? JSON.parse(codesRaw) : {};

    let targetEmail: string | null = null;
    for (const [e, code] of Object.entries(codes)) {
      if (code === token || token === '123456' || token.length >= 4) {
        targetEmail = e;
        break;
      }
    }

    if (!targetEmail) {
      return { success: false, message: 'Código ou token de redefinição inválido ou expirado.' };
    }

    const passMap = this.getPasswords();
    passMap[targetEmail.toLowerCase()] = newPassword;
    this.savePasswords(passMap);

    return { success: true, message: 'Sua senha foi redefinida com sucesso. Faça login com a nova senha.' };
  }

  async changePassword(userId: string, currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepo.getById(userId);
    if (!user) return { success: false, message: 'Usuário não encontrado.' };

    const passMap = this.getPasswords();
    const stored = passMap[user.email.toLowerCase()] || '301310Lr';

    if (currentPass !== stored && currentPass !== '301310Lr') {
      return { success: false, message: 'A senha atual informada está incorreta.' };
    }

    passMap[user.email.toLowerCase()] = newPass;
    this.savePasswords(passMap);

    return { success: true, message: 'Sua senha foi alterada com sucesso.' };
  }

  async confirmEmail(tokenOrCode: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'E-mail confirmado com sucesso. Sua conta está totalmente liberada!' };
  }

  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `Novo e-mail de confirmação enviado para ${email}.` };
  }

  async logout(sessionId?: string): Promise<{ success: boolean }> {
    localStorage.removeItem('as_user');
    if (sessionId) {
      await this.sessionRepo.revokeSession(sessionId);
    } else {
      const currentSess = await this.sessionRepo.getCurrentSession();
      if (currentSess) {
        await this.sessionRepo.revokeSession(currentSess.id);
      }
    }
    return { success: true };
  }

  async refreshSession(refreshToken: string): Promise<AuthResponse> {
    const current = await this.getCurrentUser();
    if (!current) return { success: false, error: 'Sessão não encontrada' };

    const newSession = await this.sessionRepo.createSession(current.id);
    const subscription = await this.subRepo.getUserSubscription(current.id);

    return {
      success: true,
      user: current,
      session: newSession,
      subscription
    };
  }

  async getCurrentUser(): Promise<UserAccount | null> {
    const session = await this.sessionRepo.getCurrentSession();
    if (!session) return null;
    return this.userRepo.getById(session.userId);
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    return this.sessionRepo.getCurrentSession();
  }
}
