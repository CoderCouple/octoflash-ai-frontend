/**
 * Gate around the authenticated app shell.
 *
 *   - `ready=false` (first session lookup hasn't returned yet) → render a
 *     thin loading state so we don't redirect users with a valid persisted
 *     session away from the page they came to refresh.
 *   - `ready=true && !session` → redirect to /login, passing the original
 *     pathname so login can bounce them back.
 *   - `ready=true && session` → render the children (router <Outlet/>).
 */

import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuthReady, useAuthStore, useIsAuthenticated } from "@/store";

export function ProtectedRoute() {
  const ready = useAuthReady();
  const authed = useIsAuthenticated();
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const location = useLocation();

  // Kick off bootstrap on mount. Safe under StrictMode — bootstrap()
  // is internally idempotent.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
