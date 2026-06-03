"use client";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useWebSocket } from "@shared/hooks/useWebSocket";
import { httpClient } from "@/services/api/axios.instance";
import { useToast } from "@shared/hooks/useToast";
import { ConfirmDialog } from "@shared/components/feedback/ConfirmDialog";
import { Button } from "@shared/components/ui/button";
import { Bell, Trash2, CheckCheck } from "lucide-react";
import { cn } from "@shared/lib/utils";

interface NotificationDto {
  id: string;
  title: string;
  body?: string;
  readAt?: string;
  createdAt: string;
}

interface NotificationsPage {
  data: NotificationDto[];
  total: number;
  page: number;
}

export function StudentNotificationsClient() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["students", user?.id, "notifications"],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const res = await httpClient.get<NotificationsPage>(
        `/students/${user?.id}/notifications`,
        { params: { page: pageParam, pageSize: PAGE_SIZE } }
      );
      return res.data;
    },
    getNextPageParam: (last: NotificationsPage) =>
      last.data.length === PAGE_SIZE ? last.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!user?.id,
  });

  const allNotifs = data?.pages.flatMap((p: NotificationsPage) => p.data) ?? [];

  useWebSocket({
    events: {
      NOTIFICATION_NEW: () => {
        queryClient.invalidateQueries({ queryKey: ["students", user?.id, "notifications"] });
      },
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await httpClient.patch(`/students/${user?.id}/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["students", user?.id, "notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await httpClient.patch(`/students/${user?.id}/notifications/read-all`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", user?.id, "notifications"] });
      toast({ title: "All marked as read" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await httpClient.delete(`/students/${user?.id}/notifications/${id}`);
      return res.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["students", user?.id, "notifications"] }),
  });

  const unreadCount = allNotifs.filter((n: NotificationDto) => !n.readAt).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : allNotifs.length === 0 ? (
        <div className="py-20 text-center space-y-2">
          <Bell className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allNotifs.map((notif: NotificationDto) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.readAt) markReadMutation.mutate(notif.id);
              }}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer",
                notif.readAt
                  ? "border-border bg-card hover:bg-muted/30"
                  : "border-primary/30 bg-primary/5 hover:bg-primary/[0.08]"
              )}
            >
              {!notif.readAt && (
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0 animate-in zoom-in duration-200" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    notif.readAt ? "text-foreground" : "font-semibold text-foreground"
                  )}
                >
                  {notif.title}
                </p>
                {notif.body && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(notif.id);
                }}
                className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => fetchNextPage()}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ConfirmDialog expects onCancel (not onOpenChange) and variant (not confirmVariant) */}
      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title="Delete notification"
        description="This will permanently remove this notification."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}