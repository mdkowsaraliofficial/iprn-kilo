import { HashRouter, useLocation } from "@/lib/router";
import { Header } from "@/components/layout/header";
import { FloatingNavBar } from "@/components/layout/floating-nav-bar";
import { Toaster } from "@/components/ui/sonner";
import { DashboardPage } from "@/pages/DashboardPage";
import { StatsPage } from "@/pages/StatsPage";
import { EarningsPage } from "@/pages/EarningsPage";
import { WithdrawalsPage } from "@/pages/WithdrawalsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { WalletPage } from "@/pages/WalletPage";
import { NumbersPage } from "@/pages/NumbersPage";
import { SmsPage } from "@/pages/SmsPage";
import { OtpPage } from "@/pages/OtpPage";
import { RewardsPage } from "@/pages/RewardsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { useMe } from "@/hooks/use-api";
import { useSse } from "@/lib/sse";

function SseProvider() {
  const { data: user } = useMe();
  useSse(user?.userId);
  return null;
}

function PageRenderer() {
  const path = useLocation();
  switch (path) {
    case "/stats":
      return <StatsPage />;
    case "/earnings":
      return <EarningsPage />;
    case "/withdrawals":
      return <WithdrawalsPage />;
    case "/notifications":
      return <NotificationsPage />;
    case "/wallet":
      return <WalletPage />;
    case "/numbers":
      return <NumbersPage />;
    case "/sms":
      return <SmsPage />;
    case "/otp":
      return <OtpPage />;
    case "/rewards":
      return <RewardsPage />;
    case "/profile":
      return <ProfilePage />;
    case "/":
    default:
      return <DashboardPage />;
  }
}

export default function App() {
  return (
    <HashRouter>
      <div className="relative min-h-svh bg-background">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 size-96 rounded-full bg-neon-cyan/10 blur-[120px]" />
          <div className="absolute top-1/2 -right-40 size-96 rounded-full bg-neon-purple/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-neon-green/5 blur-[100px]" />
        </div>
        <Header />
        <main className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6">
          <PageRenderer />
        </main>
        <FloatingNavBar />
        <Toaster />
        <SseProvider />
      </div>
    </HashRouter>
  );
}
