import { Bell, Moon, Sun, Check, Home, BarChart3, Wallet, Hash, MessageSquare, Clock, Award, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/components/theme-provider";
import { useNotifications } from "@/hooks/use-api";
import { useNavigate, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiClient } from "@iprn/api-client";
import { mutate } from "swr";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative size-9 rounded-full glass border-white/20 hover:neon-glow-cyan transition-shadow duration-300"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span key="moon" initial={{ rotate: -90, scale: 0, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
            <Moon className="size-4 text-neon-cyan" />
          </motion.span>
        ) : (
          <motion.span key="sun" initial={{ rotate: 90, scale: 0, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: -90, scale: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
            <Sun className="size-4 text-neon-amber" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

function NotificationPanel() {
  const notifications = useNotifications(10);
  const { data: list, isLoading } = notifications;
  const unreadCount = list.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);

  const iconFor = (type: string) => {
    switch (type) {
      case "error":
        return <Bell className="size-3.5 text-destructive" />;
      case "warning":
        return <Bell className="size-3.5 text-neon-amber" />;
      case "success":
        return <Check className="size-3.5 text-neon-green" />;
      default:
        return <Bell className="size-3.5 text-neon-purple" />;
    }
  };

  async function markAllRead() {
    try {
      await apiClient.markAllNotificationsRead();
      mutate("/v1/notifications?limit=20");
      toast.success("All notifications read");
    } catch (e) {
      toast.error("Could not mark notifications");
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-full glass border-white/20 hover:neon-glow-cyan transition-shadow duration-300"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="size-4 text-foreground/80" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
              >
                {unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 glass-strong rounded-xl border-white/20 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
              <Check className="size-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}
            </div>
          ) : (
            <AnimatePresence>
              {list.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn("flex gap-3 border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/5", !n.read && "bg-white/5")}
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/5">
                    {iconFor(n.type)}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{n.title}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                  </div>
                  {!n.read && <div className="mt-1.5 size-2 shrink-0 rounded-full bg-neon-cyan" />}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const navItems = [
  { id: "/", label: "Dashboard", icon: Home },
  { id: "/stats", label: "Stats", icon: BarChart3 },
  { id: "/wallet", label: "Wallet", icon: Wallet },
  { id: "/numbers", label: "Numbers", icon: Hash },
  { id: "/sms", label: "SMS", icon: MessageSquare },
  { id: "/otp", label: "OTP", icon: Clock },
  { id: "/rewards", label: "Rewards", icon: Award },
  { id: "/profile", label: "Profile", icon: User },
];

export function Header() {
  const navigate = useNavigate();
  const path = useLocation();
  return (
    <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-strong border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg gradient-neon">
              <span className="text-sm font-bold text-white">I</span>
            </div>
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">
              <span className="gradient-neon-text">IPRN Dashboard</span>
            </h1>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = path === item.id;
              return (
                <Button
                  key={item.id}
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("gap-1.5", active && "bg-neon-cyan/10 text-neon-cyan")}
                  onClick={() => navigate(item.id)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationPanel />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
