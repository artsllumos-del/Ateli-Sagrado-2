import { AuthSession } from '../types/auth';

export interface ISessionRepository {
  getCurrentSession(): Promise<AuthSession | null>;
  getActiveSessions(userId: string): Promise<AuthSession[]>;
  revokeSession(sessionId: string): Promise<boolean>;
  revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<boolean>;
  validateToken(accessToken: string): Promise<{ valid: boolean; userId?: string; expired?: boolean }>;
  createSession(userId: string): Promise<AuthSession>;
}
