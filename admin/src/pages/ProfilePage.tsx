import { Shield, Save, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { mutate } from "swr";
import { apiClient } from "@iprn/api-client";
import { useMe } from "@/hooks/use-api";
import { clearAuth } from "@/lib/api";

export function ProfilePage() {
  const { data: me, isLoading } = useMe();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName ?? "");
      setEmail(me.email ?? "");
    }
  }, [me]);

  async function save() {
    try {
      await apiClient.settings.updateProfile({ displayName, email });
      mutate("/v1/auth/me");
      toast.success("Profile updated");
    } catch (e) {
      toast.error("Failed to update profile");
    }
  }

  async function logout() {
    try { await apiClient.logout(); } catch {}
    clearAuth();
    window.location.reload();
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Shield className="size-6" />Profile</h1>
        <Button variant="ghost" onClick={logout}><LogOut className="size-4 mr-2" />Logout</Button>
      </div>

      <Card className="glass border-white/20 max-w-xl">
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
          </div>
          <Button onClick={save}><Save className="size-4 mr-2" />Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState, type ChangeEvent } from "react";
import { Skeleton } from "@/components/ui/skeleton";
export default ProfilePage;
