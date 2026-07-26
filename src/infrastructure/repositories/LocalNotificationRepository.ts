import { INotificationRepository, AppNotificationItem } from '../../domain/repositories/INotificationRepository';

const NOTIFS_KEY = 'as_notifications';

export class LocalNotificationRepository implements INotificationRepository {
  private getNotifs(userId: string): AppNotificationItem[] {
    const raw = localStorage.getItem(NOTIFS_KEY + '_' + userId);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* ignore */ }
    }

    const defaultNotifs: AppNotificationItem[] = [
      {
        id: 'notif_1',
        userId,
        title: 'Boas-vindas ao Ateliê Sagrado ERP',
        message: 'Sua conta e plano estão ativos. Explore as abas de Pedidos, Produtos e Financeiro!',
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_2',
        userId,
        title: 'Período de Teste Ativo',
        message: 'Aproveite 10 dias de acesso completo sem restrições.',
        type: 'info',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    localStorage.setItem(NOTIFS_KEY + '_' + userId, JSON.stringify(defaultNotifs));
    return defaultNotifs;
  }

  private saveNotifs(userId: string, items: AppNotificationItem[]): void {
    localStorage.setItem(NOTIFS_KEY + '_' + userId, JSON.stringify(items));
  }

  async getNotifications(userId: string): Promise<AppNotificationItem[]> {
    return this.getNotifs(userId);
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const items = this.getNotifs(userId);
    items.forEach(n => { if (n.id === notificationId) n.read = true; });
    this.saveNotifs(userId, items);
    return true;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const items = this.getNotifs(userId);
    items.forEach(n => n.read = true);
    this.saveNotifs(userId, items);
    return true;
  }

  async clearNotification(userId: string, notificationId: string): Promise<boolean> {
    const items = this.getNotifs(userId);
    const filtered = items.filter(n => n.id !== notificationId);
    this.saveNotifs(userId, filtered);
    return true;
  }

  async sendNotification(userId: string, title: string, message: string, type: AppNotificationItem['type'] = 'info'): Promise<AppNotificationItem> {
    const items = this.getNotifs(userId);
    const newItem: AppNotificationItem = {
      id: 'notif_' + Date.now(),
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    items.unshift(newItem);
    this.saveNotifs(userId, items);
    return newItem;
  }
}
