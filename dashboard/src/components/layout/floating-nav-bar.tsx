import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Hash, Mic, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  id: string
  label: string
  icon: typeof User
}

const navItems: NavItem[] = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "numbers", label: "My Numbers", icon: Hash },
  { id: "voice", label: "Get Voice", icon: Mic },
  { id: "sms", label: "Get SMS", icon: MessageSquare },
]

const INACTIVITY_DELAY = 5000

export function FloatingNavBar() {
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState("profile")

  const resetTimer = useCallback(() => {
    setCollapsed(false)
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const handleActivity = () => {
      setCollapsed(false)
      clearTimeout(timer)
      timer = setTimeout(() => setCollapsed(true), INACTIVITY_DELAY)
    }

    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "scroll", "touchstart"]

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))
    timer = setTimeout(() => setCollapsed(true), INACTIVITY_DELAY)

    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, handleActivity))
    }
  }, [])

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.button
            key="dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={resetTimer}
            onMouseEnter={resetTimer}
            className="size-4 rounded-full bg-neon-cyan pulse-dot"
            aria-label="Expand navigation"
          />
        ) : (
          <motion.nav
            key="nav"
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass-strong flex items-center gap-1 rounded-full border-white/20 p-1.5 shadow-2xl"
            aria-label="Main navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = active === item.id
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-3 py-2 transition-colors sm:px-4",
                    isActive ? "text-neon-cyan" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="size-4" />
                  <span className="hidden text-xs font-medium sm:inline">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-neon-cyan"
                      style={{ boxShadow: "0 0 8px var(--neon-cyan)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
