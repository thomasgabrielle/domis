import { AdminLayout } from "@/components/layout/admin-layout";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function AdminSettings() {
  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <AdminLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">Configure core eligibility algorithms and platform preferences.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Eligibility & Targeting</CardTitle>
              <CardDescription>Parameters for the PMT (Proxy Means Test) algorithm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-enroll">Automatic Enrollment Threshold</Label>
                  <span className="font-bold text-primary">Score &gt; 85</span>
                </div>
                <Slider defaultValue={[85]} max={100} step={1} className="w-full" />
                <p className="text-xs text-muted-foreground">Households with a vulnerability score above this value are automatically flagged as "Eligible".</p>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Disability Weighted Scoring</Label>
                  <p className="text-sm text-muted-foreground">Apply 1.5x multiplier to households with PWD members</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Urban/Rural Adjustment</Label>
                  <p className="text-sm text-muted-foreground">Normalize scores based on district poverty index</p>
                </div>
                <Switch defaultChecked />
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
