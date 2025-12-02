import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground tracking-tight">
              Estately
            </span>
          </a>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="/">
            <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </a>
          </Link>
          <Link href="/beneficiaries">
            <a className="text-sm font-medium text-foreground transition-colors">
              Beneficiaries
            </a>
          </Link>
           <Link href="/settings">
            <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Settings
            </a>
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
