"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  checkAndGenerateDiagnosticNotifications,
} from "@/actions/notification";
import { Badge } from "@/components/ui/Badge";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Target,
  FileText,
  FileClock,
  Award,
  Sparkles,
  TrendingDown,
  MessageSquare,
  Unlock,
  CheckCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  referenceId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper to fetch notifications
  const loadNotifications = useCallback(async (filter: "ALL" | "UNREAD" = activeTab) => {
    setIsLoading(true);
    try {
      const res = await getUserNotifications(filter);
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
        setTotalCount(res.data.totalCount);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Helper to fetch quick unread count badge
  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  // Initial load & poll diagnostic notifications
  useEffect(() => {
    refreshUnreadCount();

    // Check system diagnostic rules on initial mount
    checkAndGenerateDiagnosticNotifications().then(() => {
      refreshUnreadCount();
    }).catch(() => {});

    // Polling interval for notifications (every 30 seconds)
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  // When dropdown opens, fetch latest notifications list
  useEffect(() => {
    if (isOpen) {
      loadNotifications(activeTab);
    }
  }, [isOpen, activeTab, loadNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Mark single notification as read & navigate
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationAsRead(notif.id);
    }

    if (notif.linkUrl) {
      setIsOpen(false);
      router.push(notif.linkUrl);
    }
  };

  // Mark all as read
  const handleMarkAllRead = () => {
    startTransition(async () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await markAllNotificationsAsRead();
    });
  };

  // Format relative time
  const formatTimeAgo = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Type-specific icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "REPORT_APPROVED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "REPORT_RETURNED":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case "MANAGER_COMMENT_ADDED":
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case "TARGET_UPDATED":
        return <Target className="w-4 h-4 text-blue-600" />;
      case "PENDING_FOLLOWUP_REMINDER":
        return <Clock className="w-4 h-4 text-purple-600" />;
      case "ASSESSMENT_UNLOCKED":
        return <Unlock className="w-4 h-4 text-cyan-600" />;
      case "REPORT_SUBMITTED":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "RECRUITER_BELOW_TARGET":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "PENDING_APPROVAL":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "PENDING_REPORT":
        return <FileClock className="w-4 h-4 text-sky-600" />;
      case "TARGET_RISK":
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case "PERFORMANCE_ISSUE":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "ASSESSMENT_COMPLETION":
        return <Award className="w-4 h-4 text-indigo-600" />;
      case "CERTIFICATE_AWAITING_APPROVAL":
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-navy-950 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 border-2 border-white rounded-full shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-navy-950">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="primary" className="text-[10px] px-1.5 py-0 font-bold bg-navy-900 text-white">
                  {unreadCount} New
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="text-[11px] text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => loadNotifications(activeTab)}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Refresh notifications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-2 pb-1 bg-white border-b border-slate-100 flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`pb-1.5 font-semibold text-xs border-b-2 transition-all ${
                activeTab === "ALL"
                  ? "border-navy-900 text-navy-950"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("UNREAD")}
              className={`pb-1.5 font-semibold text-xs border-b-2 transition-all ${
                activeTab === "UNREAD"
                  ? "border-navy-900 text-navy-950"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-cyan-600" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-xs font-bold text-navy-950">You&apos;re all caught up!</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  No {activeTab === "UNREAD" ? "unread" : ""} notifications found.
                </div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 text-xs ${
                    !notif.isRead ? "bg-cyan-50/40" : "bg-white"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-navy-950 truncate">{notif.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.linkUrl && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-cyan-700 hover:text-cyan-900">
                        <span>View details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-cyan-600 shrink-0 mt-1.5" title="Unread" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
