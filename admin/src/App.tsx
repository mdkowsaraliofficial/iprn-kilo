import { HashRouter, useLocation } from "@/lib/router";
import { AdminLayout } from "@app/admin-layout";
import { AdminDashboard } from "@app/pages/AdminDashboard";
import { UsersPage } from "@app/pages/UsersPage";
import { NumbersPage } from "@app/pages/NumbersPage";
import { RewardRulesPage } from "@app/pages/RewardRulesPage";
import { ProvidersPage } from "@app/pages/ProvidersPage";
import { AnalyticsPage } from "@app/pages/AnalyticsPage";
import { HealthPage } from "@app/pages/HealthPage";
import { ApiDocsPage } from "@app/pages/ApiDocsPage";
import { WithdrawalsPage } from "@app/pages/WithdrawalsPage";
import { AuditLogsPage } from "@app/pages/AuditLogsPage";
import { SystemLogsPage } from "@app/pages/SystemLogsPage";
import { SystemSettingsPage } from "@app/pages/SystemSettingsPage";
import { ProfilePage } from "@app/pages/ProfilePage";
import { WebhooksPage } from "@app/pages/WebhooksPage";
import { ApiKeysPage } from "@app/pages/ApiKeysPage";
import { CountriesPage } from "@app/pages/CountriesPage";
import { OperatorsPage } from "@app/pages/OperatorsPage";

function AdminRenderer() {
  const path = useLocation();
  switch (path) {
    case "/":
      return <AdminDashboard />;
    case "/users":
      return <UsersPage />;
    case "/numbers":
      return <NumbersPage />;
    case "/reward-rules":
      return <RewardRulesPage />;
    case "/providers":
      return <ProvidersPage />;
    case "/analytics":
      return <AnalyticsPage />;
    case "/health":
      return <HealthPage />;
    case "/api-docs":
      return <ApiDocsPage />;
    case "/withdrawals":
      return <WithdrawalsPage />;
    case "/audit-logs":
      return <AuditLogsPage />;
    case "/system-logs":
      return <SystemLogsPage />;
    case "/settings":
      return <SystemSettingsPage />;
    case "/profile":
      return <ProfilePage />;
    case "/webhooks":
      return <WebhooksPage />;
    case "/api-keys":
      return <ApiKeysPage />;
    case "/countries":
      return <CountriesPage />;
    case "/operators":
      return <OperatorsPage />;
    default:
      return <AdminDashboard />;
  }
}

export default function App() {
  return (
    <HashRouter>
      <AdminLayout>
        <AdminRenderer />
      </AdminLayout>
    </HashRouter>
  );
}
