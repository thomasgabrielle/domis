import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Dashboard } from "@/pages/dashboard";
import { Registration } from "@/pages/registration";
import { Grievances } from "@/pages/grievances";
import { Payments } from "@/pages/payments";
import { AdminUsers } from "@/pages/admin/users";
import { AdminPrograms } from "@/pages/admin/programs";
import { AdminSettings } from "@/pages/admin/settings";
import { AdminForms } from "@/pages/admin/forms";
import { AdminBITools } from "@/pages/admin/bi-tools";
import { AdminInterop } from "@/pages/admin/interop";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/registration" component={Registration} />
      <Route path="/grievances" component={Grievances} />
      <Route path="/payments" component={Payments} />
      
      {/* Admin Routes */}
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/programs" component={AdminPrograms} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/forms" component={AdminForms} />
      <Route path="/admin/bi-tools" component={AdminBITools} />
      <Route path="/admin/interop" component={AdminInterop} />

      <Route path="/cases" component={() => <div className="p-8 text-center text-muted-foreground">Case Management Module - Under Construction</div>} />
      <Route path="/reports" component={() => <div className="p-8 text-center text-muted-foreground">M&E Reports Module - Under Construction</div>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
