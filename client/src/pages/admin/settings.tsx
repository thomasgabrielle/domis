import { AdminLayout } from "@/components/layout/admin-layout";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function AdminSettings() {
  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <AdminLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">Configure platform preferences and system controls.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Eligibility Settings</CardTitle>
              <CardDescription>Configure eligibility determination preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Disability Priority</Label>
                  <p className="text-sm text-muted-foreground">Prioritize households with members who have disabilities</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Justification</Label>
                  <p className="text-sm text-muted-foreground">Require assessors to provide notes for all decisions</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Manager Approval Required</Label>
                  <p className="text-sm text-muted-foreground">Require manager sign-off for rejection decisions</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Controls</CardTitle>
              <CardDescription>General system preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                <Label>Default Currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="local">Local Currency (L)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Offline Mode Sync</Label>
                  <p className="text-sm text-muted-foreground">Allow mobile tablets to cache data for 7 days</p>
                </div>
                <Switch defaultChecked />
              </div>
              
               <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Restrict access to admins only</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
}
