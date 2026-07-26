import { 
  AuthCredentials, 
  RegisterData, 
  AuthResponse, 
  UserAccount, 
  AuthSession 
} from '../types/auth';

export interface IAuthRepository {
  login(credentials: AuthCredentials): Promise<AuthResponse>;
  loginWithGoogle(googleToken?: string): Promise<AuthResponse>;
  register(data: RegisterData): Promise<AuthResponse>;
  recoverPassword(email: string): Promise<{ success: boolean; message: string }>;
  resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }>;
  changePassword(userId: string, currentPass: string, newPass: string): Promise<{ success: boolean; message: string }>;
  confirmEmail(tokenOrCode: string): Promise<{ success: boolean; message: string }>;
  resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }>;
  logout(sessionId?: string): Promise<{ success: boolean }>;
  refreshSession(refreshToken: string): Promise<AuthResponse>;
  getCurrentUser(): Promise<UserAccount | null>;
  getCurrentSession(): Promise<AuthSession | null>;
}
