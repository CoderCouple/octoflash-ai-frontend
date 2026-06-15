/**
 * Singleton React Query client.
 *
 * Lives in its own module so non-React code (e.g. the auth store) can
 * import it without dragging in <App />. Sign-out reaches for this to
 * `.clear()` all cached server data — otherwise a "log out, log in as a
 * different user" cycle would briefly render the previous user's /me
 * data before the new fetch resolves.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
