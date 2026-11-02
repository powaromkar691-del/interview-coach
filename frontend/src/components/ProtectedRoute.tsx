import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { MeResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Show, useAuth } from "@/components/auth/ClerkAuthProvider";

// Loads the synced user; routes new students into onboarding before the app proper.
function Gate({ children }: { children: ReactNode }) {
  const me = useQuery({ queryKey: ["me"], queryFn: () => apiGet<MeResponse>("/users/me"), retry: 1 });

  if (me.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" data-testid="protected-route-loading">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (me.isError) {
    // Backend unreachable: keep a usable partial page — never a blank screen.
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-heading text-xl font-semibold text-slate-900">We couldn't load your profile</p>
        <p className="max-w-md text-sm text-slate-500">
          The app is only partially available right now. Check your connection and try again.
        </p>
        <Button onClick={() => me.refetch()} data-testid="profile-retry-button">
          Try again
        </Button>
      </div>
    );
  }

  if (!me.data.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (!auth.isLoaded) return <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">Loading your session…</div>;
  return (
    <>
      <Show when="signed-out">
        <Navigate to="/sign-in" replace />
      </Show>
      <Show when="signed-in">
        <Gate>{children}</Gate>
      </Show>
    </>
  );
}
