import { api } from "@/lib/axios";
import { asApiData, withServiceError } from "./serviceUtils";

export interface Notification {
  id: number;
  student_id: number;
  title: string;
  message: string;
  notification_type: "event" | "timetable" | "elective" | "announcement";
  related_id?: number;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Notification Service
 * Handles all notification-related API calls
 */

const notificationService = {
  /**
   * Get all notifications for the current user
   * GET /api/notifications
   */
  getNotifications: withServiceError(
    async (unreadOnly = false, page = 1, limit = 20) => {
      const response = await api.get<NotificationResponse>("/notifications", {
        params: {
          unread_only: unreadOnly,
          page,
          limit,
        },
      });
      return asApiData(response);
    },
  ),

  /**
   * Get unread notification count
   * GET /api/notifications/count
   */
  getUnreadCount: withServiceError(async () => {
    const response = await api.get<{ unread_count: number }>(
      "/notifications/count",
    );
    return asApiData(response);
  }),

  /**
   * Mark a single notification as read
   * PATCH /api/notifications/:id/read
   */
  markAsRead: withServiceError(async (notificationId: number) => {
    const response = await api.patch<{ notification: Notification }>(
      `/notifications/${notificationId}/read`,
    );
    return asApiData(response);
  }),

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  markAllAsRead: withServiceError(async () => {
    const response = await api.patch<{ updated_count: number }>(
      "/notifications/read-all",
    );
    return asApiData(response);
  }),

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  deleteNotification: withServiceError(async (notificationId: number) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return asApiData(response);
  }),

  /**
   * Clear all notifications
   * DELETE /api/notifications/clear-all
   */
  clearAll: withServiceError(async () => {
    const response = await api.delete<{ deleted_count: number }>(
      "/notifications/clear-all",
    );
    return asApiData(response);
  }),

  /**
   * Create notifications (internal use - admin only)
   */
  createNotification: withServiceError(
    async (
      studentIds: number[],
      title: string,
      message: string,
      notificationType: string,
      relatedId?: number,
    ) => {
      const response = await api.post("/notifications/create-internal", {
        studentIds,
        title,
        message,
        notification_type: notificationType,
        related_id: relatedId,
      });
      return asApiData(response);
    },
  ),
};

export default notificationService;
