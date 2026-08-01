import { type ReactNode } from "react";
import {
  Home,
  Users,
  Hash,
  Award,
  Globe,
  BarChart3,
  HeartPulse,
  Wallet,
  FileText,
  Settings,
  BookText,
  Shield,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "@/lib/router";

type NavItem = { id: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> };

const navItems: NavItem[] = [
  { id: "/", label: "Dashboard", icon: Home },
  { id: "/users", label: "Users", icon: Users },
  { id: "/numbers", label: "Numbers", icon: Hash },
  { id: "/reward-rules", label: "Reward Rules", icon: Award },
  { id: "/providers", label: "Providers", icon: Globe },
  { id: "/analytics", label: "Analytics", icon: BarChart3 },
  { id: "/health", label: "Health", icon: HeartPulse },
  { id: "/withdrawals", label: "Withdrawals", icon: Wallet },
  { id: "/webhooks", label: "Webhooks", icon: Shield },
  { id: "/api-keys", label: "API Keys", icon: FileText },
  { id: "/audit-logs", label: "Audit Logs", icon: FileText },
  { id: "/system-logs", label: "System Logs", icon: FileText },
  { id: "/countries", label: "Countries", icon: Globe },
  { id: "/operators", label: "Operators", icon: Users },
  { id: "/settings", label: "System Settings", icon: Settings },
  { id: "/api-docs", label: "API Docs", icon: BookText },
  { id: "/profile", label: "Profile", icon: Shield },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const path = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="relative min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-y-2 overflow-y-auto glass-strong border-r border-white/10 p-4 md:flex">
        <div className="flex size-9 items-center justify-center rounded-lg gradient-neon">
          <span className="text-sm font-bold text-white">IPRN</span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = path === item.id;
            return (
              <Button
                key={item.id}
                variant={active ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-2", active && "bg-neon-cyan/10 text-neon-cyan")}
                onClick={() => navigate(item.id)}
              >
                <Icon className="size-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-white/10">
          <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? "light" : "dark")}>
            {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 glass-strong border-b border-white/10 h-14 flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold gradient-neon-text">IPRN Admin</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
            <Shield className="size-4" />
          </Button>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
