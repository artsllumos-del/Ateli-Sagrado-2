export interface AppNotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface INotificationRepository {
  getNotifications(userId: string): Promise<AppNotificationItem[]>;
  markAsRead(userId: string, notificationId: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<boolean>;
  clearNotification(userId: string, notificationId: string): Promise<boolean>;
  sendNotification(userId: string, title: string, message: string, type?: AppNotificationItem['type']): Promise<AppNotificationItem>;
}
