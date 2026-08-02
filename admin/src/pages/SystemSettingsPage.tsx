import { useState } from "react";
import { Settings, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { SystemSetting } from "@iprn/types";

export function SystemSettingsPage() {
  const { data: list, isLoading } = useSWR<SystemSetting[]>("/v1/admin/system-settings", () => apiClient.admin.systemSettings(), adminSwr);
  const [saving, setSaving] = useState<string | null>(null);

  async function save(key: string, value: string) {
    setSaving(key);
    try {
      await apiClient.admin.updateSetting(key, { value });
      mutate("/v1/admin/system-settings");
      toast.success("Setting updated");
    } catch (e: any) {
      toast.error("Failed to update setting");
    } finally {
      setSaving(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Settings className="size-6" />System Settings</h1>
      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Key</TableHead><TableHead>Category</TableHead><TableHead>Value</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {(list ?? []).map((s) => (
                  <SettingRow key={s.key} setting={s} saving={saving} onSave={save} />
                ))}
                {list?.length === 0 && <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">No settings.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({ setting, saving, onSave }: { setting: SystemSetting; saving: string | null; onSave: (key: string, value: string) => void }) {
  const [local, setLocal] = useState(String(setting.value ?? ""));
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{setting.key}</TableCell>
      <TableCell><Badge variant="outline">{setting.category}</Badge></TableCell>
      <TableCell>
        <Input value={local} onChange={(e) => setLocal(e.target.value)} className="max-w-xs" />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{setting.updatedBy ? `${setting.updatedBy} · ` : ""}{new Date(setting.updatedAt).toLocaleString()}</TableCell>
      <TableCell className="text-right">
        <Button size="sm" disabled={saving === setting.key} onClick={() => onSave(setting.key, local)}>
          {saving === setting.key ? "Saving…" : <><Save className="size-3 mr-1" />Save</>}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default SystemSettingsPage;
