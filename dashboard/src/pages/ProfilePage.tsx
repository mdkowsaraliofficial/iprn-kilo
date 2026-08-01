import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User as UserIcon, Save, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { mutate } from "swr";
import { apiClient } from "@iprn/api-client";
import { useMe } from "@/hooks/use-api";
import { clearAuth } from "@/lib/api";

const profileSchema = z.object({
  displayName: z.string().min(1),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { data: me, isLoading } = useMe();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: me?.displayName ?? "", email: me?.email ?? "" },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card className="glass border-white/20"><CardContent className="p-6 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
      </div>
    );
  }

  const handleLogout = async () => {
    try { await apiClient.logout(); } catch {}
    clearAuth();
    window.location.reload();
  };

  async function onSubmit(values: ProfileFormValues) {
    try {
      await apiClient.settings.updateProfile(values);
      mutate("/v1/auth/me");
      toast.success("Profile updated");
    } catch (e) {
      toast.error("Failed to update profile");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="size-4 mr-2" />
          Logout
        </Button>
      </div>

      <Card className="glass border-white/20 max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserIcon className="size-5" /> Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Save className="size-4 mr-2" /> Save
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;
