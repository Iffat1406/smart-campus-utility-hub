import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  X,
  CheckCircle2,
  Calendar,
  BookOpen,
  AlertCircle,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Notification } from "@/services/notificationService";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * NotificationCenter Component
 * Displays user notifications with toast integration
 */
export function NotificationCenter({
  isOpen,
  onClose,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    isMarkingAsRead,
    isDeleting,
    isClearing,
  } = useNotifications();

  const [shownToastIds, setShownToastIds] = useState<Set<number>>(new Set());

  // Show toast notifications for new unread notifications
  useEffect(() => {
    unreadNotifications.forEach((notification) => {
      if (!shownToastIds.has(notification.id)) {
        showNotificationToast(notification);
        setShownToastIds((prev) => new Set(prev).add(notification.id));
      }
    });
  }, [unreadNotifications, shownToastIds]);

  const showNotificationToast = (notification: Notification) => {
    const icon = getNotificationIcon(notification.notification_type);
    const title = notification.title;
    const message = notification.message;

    toast.custom(
      (toastId) => (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex items-start gap-3 w-full"
        >
          <div className="flex-shrink-0 mt-1">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {message}
            </p>
          </div>
          <button
            onClick={() => {
              toast.dismiss(toastId);
              markAsRead(notification.id);
            }}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </motion.div>
      ),
      {
        duration: 5000,
        className: "glass border border-primary/20",
      },
    );
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case "event":
        return <Calendar className={`${iconClass} text-blue-500`} />;
      case "timetable":
        return <AlertCircle className={`${iconClass} text-purple-500`} />;
      case "elective":
        return <BookOpen className={`${iconClass} text-green-500`} />;
      default:
        return <Bell className={`${iconClass} text-amber-500`} />;
    }
  };

  const getNotificationBadgeVariant = (
    type: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "event":
        return "default";
      case "timetable":
        return "secondary";
      case "elective":
        return "outline";
      default:
        return "default";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Notification Panel */}
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-primary/20 shadow-lg z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Notifications</h2>
                {unreadCount > 0 && (
                  <Badge className="ml-2">{unreadCount}</Badge>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex gap-2 px-4 pt-3 pb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markAllAsRead()}
                  disabled={unreadCount === 0 || isMarkingAsRead}
                  className="flex-1"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => clearAll()}
                  disabled={isClearing}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32">
                  <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          !notification.is_read
                            ? "bg-primary/5 border-primary/20"
                            : ""
                        }`}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(
                                notification.notification_type,
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-sm line-clamp-1">
                                  {notification.title}
                                </h3>
                                <Badge
                                  variant={getNotificationBadgeVariant(
                                    notification.notification_type,
                                  )}
                                  className="text-xs flex-shrink-0"
                                >
                                  {notification.notification_type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                {formatTime(notification.created_at)}
                                {notification.is_read && " • Read"}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              disabled={isDeleting}
                              className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NotificationCenter;
