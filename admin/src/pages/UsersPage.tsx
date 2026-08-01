import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { AdminUser } from "@iprn/types";

export function UsersPage() {
  const { data: list, isLoading } = useSWR<AdminUser[]>("/v1/admin/users", () => apiClient.admin.users(), adminSwr);


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
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
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>API</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.displayName}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.tier}</TableCell>
                      <TableCell><Shield className="size-4" /> {u.role}</TableCell>
                      <TableCell>{u.status}</TableCell>
                      <TableCell>{u.apiEnabled ? "Enabled" : "Disabled"}</TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-sm text-muted-foreground">No users.</TableCell></TableRow>
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

export default UsersPage;
