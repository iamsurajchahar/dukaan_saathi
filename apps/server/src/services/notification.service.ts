import { Notification } from '../models/notification.model';

export const notificationService = {
  async create(
    userId: string,
    storeId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ) {
    return Notification.create({ userId, storeId, type, title, message, data });
  },

  async getAll(userId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async markRead(userId: string, notificationId: string) {
    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true }
    );
    return { message: 'Notification marked as read' };
  },

  async markAllRead(userId: string) {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read' };
  },

  async getUnreadCount(userId: string) {
    const count = await Notification.countDocuments({ userId, isRead: false });
    return { count };
  },
};
