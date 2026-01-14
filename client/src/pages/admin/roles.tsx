import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Users, ChevronRight, Lock, Save, Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Permission = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  module: string;
};

type Role = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
  permissions?: Permission[];
};

export function AdminRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: allPermissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  const { data: roleData, isLoading: roleLoading } = useQuery<Role & { permissions: Permission[] }>({
    queryKey: ["/api/roles", selectedRole],
    enabled: !!selectedRole,
  });

  const savePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      return apiRequest("PUT", `/api/roles/${roleId}/permissions`, { permissionIds });
    },
    onSuccess: () => {
      toast({ title: "Permissions saved", description: "Role permissions have been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setHasChanges(false);
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    const newPermissions = new Set(rolePermissions);
    if (checked) {
      newPermissions.add(permissionId);
    } else {
      newPermissions.delete(permissionId);
    }
    setRolePermissions(newPermissions);
    setHasChanges(true);
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
      savePermissionsMutation.mutate({
        roleId: selectedRole,
        permissionIds: Array.from(rolePermissions),
      });
    }
  };

  const permissionsByModule = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const selectedRoleData = roles.find((r) => r.id === selectedRole);

  useEffect(() => {
    if (roleData?.permissions) {
      setRolePermissions(new Set(roleData.permissions.map((p) => p.id)));
    }
  }, [roleData]);

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-background font-sans pb-12">
        <Navbar />
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AdminLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <AdminLayout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-muted-foreground">Configure access levels and permissions for system roles.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                System Roles
              </CardTitle>
              <CardDescription>Select a role to manage its permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  data-testid={`role-item-${role.id}`}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                    selectedRole === role.id
                      ? "bg-primary/5 border-primary"
                      : "bg-card hover:bg-accent/50 border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      selectedRole === role.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {role.displayName}
                        {role.isSystemRole && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{role.description}</div>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${
                    selectedRole === role.id ? "text-primary" : "text-muted-foreground"
                  }`} />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {selectedRoleData ? selectedRoleData.displayName : "Select a Role"}
                  </CardTitle>
                  <CardDescription>
                    {selectedRoleData
                      ? selectedRoleData.description
                      : "Choose a role from the list to view and edit its permissions"}
                  </CardDescription>
                </div>
                {selectedRole && (
                  <Button
                    data-testid="save-permissions-button"
                    onClick={handleSavePermissions}
                    disabled={!hasChanges || savePermissionsMutation.isPending}
                    className="gap-2"
                  >
                    {savePermissionsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedRole ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Select a role to manage its permissions</p>
                </div>
              ) : roleLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Accordion type="multiple" className="w-full" defaultValue={Object.keys(permissionsByModule)}>
                  {Object.entries(permissionsByModule).map(([module, perms]) => (
                    <AccordionItem key={module} value={module}>
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {module}
                          <Badge variant="secondary" className="text-xs font-normal">
                            {perms.filter((p) => rolePermissions.has(p.id)).length}/{perms.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pl-1">
                          {perms.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-start gap-3 cursor-pointer group"
                              data-testid={`permission-item-${permission.id}`}
                            >
                              <Checkbox
                                data-testid={`permission-checkbox-${permission.id}`}
                                checked={rolePermissions.has(permission.id)}
                                onCheckedChange={(checked) =>
                                  handlePermissionToggle(permission.id, checked as boolean)
                                }
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium group-hover:text-primary transition-colors">
                                  {permission.displayName}
                                </div>
                                <div className="text-xs text-muted-foreground">{permission.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
}
