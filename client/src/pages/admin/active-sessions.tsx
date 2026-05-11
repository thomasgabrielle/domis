import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, LogOut, RefreshCw, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";

type ActiveSession = {
  sid: string;
  userId: string | null;
  username: string | null;
  fullName: string | null;
  role: string | null;
  department: string | null;
  district: string | null;
  expire: string;
};

export function AdminActiveSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: sessions = [], isLoading, refetch } = useQuery<ActiveSession[]>({
    queryKey: ["/api/admin/active-sessions"],
    refetchInterval: 30000,
  });

  const terminateMutation = useMutation({
    mutationFn: async (sid: string) => {
      return apiRequest("DELETE", `/api/admin/active-sessions/${encodeURIComponent(sid)}`);
    },
    onSuccess: () => {
      toast({ title: "Session terminated", description: "The user has been logged out." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/active-sessions"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const authenticatedSessions = sessions.filter((s) => s.userId);
  const anonymousSessions = sessions.filter((s) => !s.userId);

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    const label = role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (role === "system_admin") {
      return <Badge variant="default">{label}</Badge>;
    }
    return <Badge variant="secondary">{label}</Badge>;
  };

  if (isLoading) {
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
            <h1 className="text-2xl font-heading font-bold text-foreground">Active Sessions</h1>
            <p className="text-muted-foreground">
              Monitor logged-in users and manage active sessions.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{authenticatedSessions.length}</p>
                  <p className="text-sm text-muted-foreground">Logged-in users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{anonymousSessions.length}</p>
                  <p className="text-sm text-muted-foreground">Anonymous sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                  <p className="text-sm text-muted-foreground">Total sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Authenticated Sessions ({authenticatedSessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {authenticatedSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No active authenticated sessions.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authenticatedSessions.map((session) => {
                    const isCurrentUser = session.userId === currentUser?.id;
                    return (
                      <TableRow key={session.sid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {session.fullName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "?"}
                            </div>
                            <div>
                              <div className="font-medium">
                                {session.fullName || "Unknown"}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{session.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(session.role)}</TableCell>
                        <TableCell>{session.department || "-"}</TableCell>
                        <TableCell>{session.district || "-"}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(session.expire), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive"
                            onClick={() => terminateMutation.mutate(session.sid)}
                            disabled={terminateMutation.isPending}
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            {isCurrentUser ? "Logout" : "Terminate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </AdminLayout>
    </div>
  );
}
