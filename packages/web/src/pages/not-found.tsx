import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Generic 404. Matched as the trailing `path: "*"` route in routes.tsx so any
 * URL the router doesn't recognise lands here.
 */
export default function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-6 text-center">
      <div className="text-[64px] font-semibold tracking-tight leading-none mb-2">
        404
      </div>
      <h1 className="text-xl font-semibold tracking-tight mb-1">
        That page doesn’t exist
      </h1>
      <p className="text-sm text-muted-foreground mb-1 max-w-md">
        We couldn’t find anything at{" "}
        <code className="font-mono text-foreground/80">{location.pathname}</code>.
      </p>
      <p className="text-xs text-muted-foreground mb-6">
        It may have moved, or the link might be wrong.
      </p>

      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/videos">
            <Compass className="size-3.5 mr-1.5" /> Go to videos
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" onClick={() => window.history.back()}>
          <span>
            <ArrowLeft className="size-3.5 mr-1.5" /> Back
          </span>
        </Button>
      </div>
    </div>
  );
}
