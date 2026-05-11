import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import { Login } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { Registration } from "@/pages/registration";
import { Grievances } from "@/pages/grievances";
import { Payments } from "@/pages/payments";
import { Assessments } from "@/pages/assessments";
import { CaseManagement } from "@/pages/cases";
import { Reports } from "@/pages/reports";
import { Worksheet } from "@/pages/worksheet";
import { Registry } from "@/pages/registry";
import { ApplicationDetail } from "@/pages/application-detail";
import { ApplicationEdit } from "@/pages/application-edit";
import { HomeVisits } from "@/pages/home-visits";
import { HomeVisitDetail } from "@/pages/home-visit-detail";
import { AdminUsers } from "@/pages/admin/users";
import { AdminPrograms } from "@/pages/admin/programs";
import { AdminSettings } from "@/pages/admin/settings";
import { AdminForms } from "@/pages/admin/forms";
import { AdminBITools } from "@/pages/admin/bi-tools";
import { AdminInterop } from "@/pages/admin/interop";
import { AdminRoles } from "@/pages/admin/roles";
import { AdminActiveSessions } from "@/pages/admin/active-sessions";

function Router() {
  return (
    <Switch>
      {/* Public route */}
      <Route path="/login" component={Login} />

      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute permission="dashboard.view">
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/registration">
        <ProtectedRoute permission="intake.create">
          <Registration />
        </ProtectedRoute>
      </Route>

      <Route path="/worksheet">
        <ProtectedRoute permission={["intake.view", "application.view"]}>
          <Worksheet />
        </ProtectedRoute>
      </Route>

      <Route path="/registry">
        <ProtectedRoute permission={["client.view", "client.view_partial"]}>
          <Registry />
        </ProtectedRoute>
      </Route>

      <Route path="/application/:id">
        {(params) => (
          <ProtectedRoute permission={["intake.view", "application.view"]}>
            <ApplicationDetail />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/application/:id/edit">
        {(params) => (
          <ProtectedRoute permission="application.edit">
            <ApplicationEdit />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/home-visits">
        <ProtectedRoute permission="home_visit.view">
          <HomeVisits />
        </ProtectedRoute>
      </Route>

      <Route path="/home-visit/:id">
        {(params) => (
          <ProtectedRoute permission="home_visit.view">
            <HomeVisitDetail />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/assessments">
        <ProtectedRoute permission={["assessment.view", "recommendation.view", "recommendation.create"]}>
          <Assessments />
        </ProtectedRoute>
      </Route>

      <Route path="/cases">
        <ProtectedRoute permission="application.view">
          <CaseManagement />
        </ProtectedRoute>
      </Route>

      <Route path="/payments">
        <ProtectedRoute permission="payment.view">
          <Payments />
        </ProtectedRoute>
      </Route>

      <Route path="/grievances">
        <ProtectedRoute permission="application.view">
          <Grievances />
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute permission="dashboard.view">
          <Reports />
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/users">
        <ProtectedRoute permission="admin.view">
          <AdminUsers />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/roles">
        <ProtectedRoute permission="admin.view">
          <AdminRoles />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/programs">
        <ProtectedRoute permission="admin.view">
          <AdminPrograms />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/settings">
        <ProtectedRoute permission="admin.view">
          <AdminSettings />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/forms">
        <ProtectedRoute permission={["form_builder.view", "admin.view"]}>
          <AdminForms />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/bi-tools">
        <ProtectedRoute permission="admin.view">
          <AdminBITools />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/interop">
        <ProtectedRoute permission="admin.view">
          <AdminInterop />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/sessions">
        <ProtectedRoute permission="admin.view">
          <AdminActiveSessions />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
