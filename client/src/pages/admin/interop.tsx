import { AdminLayout } from "@/components/layout/admin-layout";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, RefreshCw, Globe } from "lucide-react";

export function AdminInterop() {
  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <AdminLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-foreground">Data Exchange API</h1>
          <p className="text-muted-foreground">Manage API keys, webhooks, and interoperability endpoints.</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API Access Keys
              </CardTitle>
              <CardDescription>Credentials for external systems (e.g., Payment Providers, KoboToolbox).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    Mobile Money Provider A
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Last used: 2 mins ago • Scopes: `payment.write`, `payment.read`</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-3 w-3" /> Rotate Key
                  </Button>
                  <Button variant="secondary" size="sm">Revoke</Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    KoboToolbox Sync
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Last used: 1 hour ago • Scopes: `form.read`, `submission.read`</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-3 w-3" /> Rotate Key
                  </Button>
                  <Button variant="secondary" size="sm">Revoke</Button>
                </div>
              </div>

              <Button className="w-full sm:w-auto gap-2">
                <PlusIcon className="h-4 w-4" /> Generate New API Key
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Webhooks
              </CardTitle>
              <CardDescription>Event notifications sent to external URLs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                   <div className="md:col-span-2 space-y-2">
                     <Label>Endpoint URL</Label>
                     <Input placeholder="https://api.partner.org/webhooks/pap-events" />
                   </div>
                   <div className="space-y-2">
                     <Label>Event Type</Label>
                     <Select defaultValue="payment_status">
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="payment_status">payment.status_change</SelectItem>
                         <SelectItem value="enrollment">household.enrolled</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                </div>
                <Button variant="secondary" className="w-full md:w-auto self-end">Add Webhook</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
}

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus as PlusIcon } from "lucide-react";

