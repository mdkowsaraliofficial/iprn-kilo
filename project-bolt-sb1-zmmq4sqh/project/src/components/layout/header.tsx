import { Bell, Moon, Sun, Check, DollarSign, ShieldCheck, Settings } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTheme } from "@/components/theme-provider"
import { useNotifications } from "@/hooks/use-api"
import { cn } from "@/lib/utils"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)

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
          <motion.span
            key="moon"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute"
          >
            <Moon className="size-4 text-neon-cyan" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute"
          >
            <Sun className="size-4 text-neon-amber" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  )
}

function NotificationPanel() {
  const { data: notifications, isLoading } = useNotifications()
  const [open, setOpen] = useState(false)
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  const iconFor = (type: string) => {
    switch (type) {
      case "earnings":
        return <DollarSign className="size-3.5 text-neon-green" />
      case "approval":
        return <ShieldCheck className="size-3.5 text-neon-cyan" />
      default:
        return <Settings className="size-3.5 text-neon-purple" />
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
      <PopoverContent
        align="end"
        className="w-80 p-0 glass-strong rounded-xl border-white/20 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : (
            <AnimatePresence>
              {notifications?.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex gap-3 border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/5",
                    !n.read && "bg-white/5"
                  )}
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/5">
                    {iconFor(n.type)}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{n.title}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                  </div>
                  {!n.read && (
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-neon-cyan" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        <div className="border-t border-white/10 p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setOpen(false)}>
            <Check className="size-3 mr-1" /> Mark all as read
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function Header() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationPanel />
          </div>
        </div>
      </div>
    </motion.header>
  )
}
