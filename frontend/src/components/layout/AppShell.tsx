import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Briefcase,
  FileSearch,
  History as HistoryIcon,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Route as RouteIcon,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserButton } from "@/components/auth/ClerkAuthProvider";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/interview", label: "Mock Interview", icon: MessagesSquare },
  { to: "/practice", label: "Practice", icon: Swords },
  { to: "/resume", label: "Resume", icon: FileSearch },
  { to: "/roadmap", label: "Roadmap", icon: RouteIcon },
  { to: "/history", label: "History", icon: HistoryIcon },
];

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ease-out",
    isActive ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-xs backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2" data-testid="app-shell-brand-link">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B132B] text-white">
              <Briefcase className="h-4 w-4" />
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight text-slate-900">Interview Coach</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navClass} data-testid={`nav-link-${to.slice(1).replace("/", "-")}`}>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <UserButton />
            <span className="md:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger
                  render={
                    <Button variant="outline" size="icon" aria-label="Open navigation menu" data-testid="nav-mobile-trigger" />
                  }
                >
                  <Menu className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="font-heading text-slate-900">Interview Coach</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-2 flex flex-col gap-1" aria-label="Mobile">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setOpen(false)}
                        className={navClass}
                        data-testid={`mobile-nav-link-${to.slice(1).replace("/", "-")}`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </NavLink>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
