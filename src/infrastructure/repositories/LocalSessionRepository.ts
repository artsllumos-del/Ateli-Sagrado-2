import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { AuthSession } from '../../domain/types/auth';

const SESSIONS_KEY = 'as_auth_sessions';
const CURRENT_TOKEN_KEY = 'as_access_token';

export class LocalSessionRepository implements ISessionRepository {
  private getSessions(): AuthSession[] {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveSessions(sessions: AuthSession[]): void {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    if (!token) return null;

    const sessions = this.getSessions();
    const found = sessions.find(s => s.accessToken === token);
    if (!found) return null;

    // Check expiration
    if (found.expiresAt < Date.now()) {
      return null;
    }

    return { ...found, isCurrent: true };
  }

  async getActiveSessions(userId: string): Promise<AuthSession[]> {
    const currentToken = localStorage.getItem(CURRENT_TOKEN_KEY);
    const sessions = this.getSessions().filter(s => s.userId === userId && s.expiresAt > Date.now());
    return sessions.map(s => ({
      ...s,
      isCurrent: s.accessToken === currentToken
    }));
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    const sessions = this.getSessions();
    const currentToken = localStorage.getItem(CURRENT_TOKEN_KEY);
    const target = sessions.find(s => s.id === sessionId);

    const filtered = sessions.filter(s => s.id !== sessionId);
    this.saveSessions(filtered);

    if (target && target.accessToken === currentToken) {
      localStorage.removeItem(CURRENT_TOKEN_KEY);
    }
    return true;
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<boolean> {
    const sessions = this.getSessions();
    const updated = sessions.filter(s => s.userId !== userId || s.id === currentSessionId);
    this.saveSessions(updated);
    return true;
  }

  async validateToken(accessToken: string): Promise<{ valid: boolean; userId?: string; expired?: boolean }> {
    const sessions = this.getSessions();
    const found = sessions.find(s => s.accessToken === accessToken);
    if (!found) return { valid: false };

    if (found.expiresAt < Date.now()) {
      return { valid: false, expired: true, userId: found.userId };
    }

    return { valid: true, userId: found.userId };
  }

  async createSession(userId: string): Promise<AuthSession> {
    const sessions = this.getSessions();
    const now = Date.now();
    const token = 'at_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const refreshToken = 'rt_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

    const newSession: AuthSession = {
      id: 'sess_' + now + '_' + Math.floor(Math.random() * 1000),
      userId,
      accessToken: token,
      refreshToken,
      expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours expiry
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ipAddress: '187.54.120.42 (São Paulo - SP)',
      userAgent: window.navigator.userAgent,
      device: window.innerWidth < 768 ? 'Smartphone (Mobile)' : 'Desktop Browser (Chrome/Vite)',
      isCurrent: true
    };

    sessions.push(newSession);
    this.saveSessions(sessions);
    localStorage.setItem(CURRENT_TOKEN_KEY, token);

    return newSession;
  }
}
