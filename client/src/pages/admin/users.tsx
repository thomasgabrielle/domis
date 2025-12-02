import { AdminLayout } from "@/components/layout/admin-layout";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, Shield, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminUsers() {
  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <AdminLayout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage system access, roles, and permissions.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>System Users</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-8 h-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        JD
                      </div>
                      <div>
                        <div className="font-medium">Jane Doe</div>
                        <div className="text-xs text-muted-foreground">jane.doe@ministry.gov</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-primary" />
                      <span className="font-medium">Super Admin</span>
                    </div>
                  </TableCell>
                  <TableCell>IT Operations</TableCell>
                  <TableCell><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">2 mins ago</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold">
                        RK
                      </div>
                      <div>
                        <div className="font-medium">Robert Kim</div>
                        <div className="text-xs text-muted-foreground">r.kim@ministry.gov</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>Case Worker</span>
                    </div>
                  </TableCell>
                  <TableCell>Social Services</TableCell>
                  <TableCell><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">1 day ago</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AdminLayout>
    </div>
  );
}
