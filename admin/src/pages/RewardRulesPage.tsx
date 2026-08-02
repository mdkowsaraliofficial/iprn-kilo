import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { mutate } from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import useSWR from "swr";
import type { RewardRule, RewardRuleLevel } from "@iprn/types";

const LEVELS: RewardRuleLevel[] = ["global", "per_sms", "per_otp", "per_country", "per_operator", "per_provider", "per_number"];

function CreateForm() {
  const [level, setLevel] = useState<RewardRuleLevel>("global");
  const [target, setTarget] = useState("");
  const [base, setBase] = useState("");
  const [multiplier, setMultiplier] = useState("1");
  const [priority, setPriority] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    try {
      await apiClient.admin.createRewardRule({
        level,
        target: target || null,
        baseAmountCents: Number(base),
        multiplier: Number(multiplier),
        priority: Number(priority),
        active: true,
      });
      mutate("/v1/admin/reward-rules");
      setTarget(""); setBase(""); setMultiplier("1"); setPriority("0");
      toast.success("Reward rule created");
    } catch (e: any) {
      toast.error(e?.problem?.detail ?? "Failed to create rule");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="glass border-white/20 max-w-xl">
      <CardHeader><CardTitle>Create Reward Rule</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Level</Label>
          <Select value={level} onValueChange={(v) => setLevel(v as RewardRuleLevel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target</Label>
          <Input placeholder="e.g. US or operator slug" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div>
          <Label>Base amount (cents)</Label>
          <Input type="number" min={0} value={base} onChange={(e) => setBase(e.target.value)} />
        </div>
        <div>
          <Label>Multiplier</Label>
          <Input type="number" step={0.1} min={0} value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex items-end gap-2">
          <div className="flex-1">
            <Label>Priority</Label>
            <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </div>
          <Button onClick={onSubmit} disabled={submitting || !base}><Plus className="size-4 mr-2" />Create</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RewardRulesPage() {
  const { data: list, isLoading } = useSWR<RewardRule[]>("/v1/admin/reward-rules", () => apiClient.admin.rewardRules(), adminSwr);

  async function toggleActive(rule: RewardRule) {
    try {
      await apiClient.admin.updateRewardRule(rule.id, { active: !rule.active });
      mutate("/v1/admin/reward-rules");
    } catch (e: any) {
      toast.error("Failed to update rule");
    }
  }

  async function remove(id: string) {
    try {
      await apiClient.admin.deleteRewardRule(id);
      mutate("/v1/admin/reward-rules");
    } catch (e: any) {
      toast.error("Failed to delete rule");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reward Rules</h1>
      <CreateForm />

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Rules</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Base (cents)</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.level}</TableCell>
                      <TableCell>{r.target ?? "—"}</TableCell>
                      <TableCell>{r.baseAmountCents}</TableCell>
                      <TableCell>{r.multiplier}</TableCell>
                      <TableCell>{r.priority}</TableCell>
                      <TableCell>
                        <Switch checked={r.active} onCheckedChange={() => toggleActive(r)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => remove(r.id)}><Trash2 className="size-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-sm text-muted-foreground">No rules.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RewardRulesPage;
