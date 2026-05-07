import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import notificationService, {
  Notification,
} from "@/services/notificationService";

/**
 * Custom hook for managing notifications
 * Provides real-time notification updates, polling, and mutations
 */
export function useNotifications(pollInterval = 30000) {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await notificationService.getNotifications(false, 1, 50);
      return response?.data;
    },
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ["unreadNotificationCount"],
    queryFn: async () => {
      const response = await notificationService.getUnreadCount();
      return response?.data;
    },
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });

  // Update unread count whenever it changes
  useEffect(() => {
    if (unreadData?.unread_count !== undefined) {
      setUnreadCount(unreadData.unread_count);
    }
  }, [unreadData]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: number) =>
      notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: () => notificationService.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });

  // Setup polling for new notifications
  useEffect(() => {
    const setupPolling = () => {
      pollTimeoutRef.current = setTimeout(() => {
        refetch();
      }, pollInterval);
    };

    setupPolling();

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [pollInterval, refetch]);

  const notifications = notificationsData?.notifications || [];
  const unreadNotifications = notifications.filter((n) => !n.is_read);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    error,

    // Actions
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    clearAll: clearAllMutation.mutate,

    // Loading states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isClearing: clearAllMutation.isPending,

    // Refetch
    refetch,
  };
}
