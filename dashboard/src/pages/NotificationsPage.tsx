import { CheckCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { mutate } from "swr";
import { apiClient } from "@iprn/api-client";
import type { Notification } from "@iprn/types";
import { useNotifications } from "@/hooks/use-api";

const label = (n: Notification) => {
  switch (n.type) {
    case "error":
      return "Destructive";
    case "warning":
      return "Warning";
    case "success":
      return "Success";
    case "info":
    default:
      return "Info";
  }
};

export function NotificationsPage() {
  const notifications = useNotifications(50);
  const { data: list, isLoading } = notifications;

  async function markRead(id: string) {
    try {
      await apiClient.markNotificationRead(id);
      mutate("/v1/notifications?limit=50");
    } catch (e) {
      toast.error("Could not mark notification");
    }
  }

  async function markAllRead() {
    try {
      await apiClient.markAllNotificationsRead();
      mutate("/v1/notifications?limit=50");
      toast.success("All notifications read");
    } catch (e) {
      toast.error("Could not mark notifications");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="ghost" onClick={markAllRead}>
          <CheckCheck className="size-4 mr-2" /> Mark all read
        </Button>
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications.</p>
        ) : (
          list.map((n) => (
            <Card key={n.id} className="glass border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{n.title}</CardTitle>
                <Badge variant={n.read ? "outline" : label(n) === "Destructive" ? "destructive" : "default"}>
                  {n.read ? "Read" : "New"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString()}</time>
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
