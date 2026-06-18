/**
 * Tiny debounce hook for "fire once user stops typing" patterns.
 *
 * Usage:
 *   const savePrompt = useDebouncedCallback((value: string) => {
 *     patchScene(sceneId, { prompt: value });
 *   }, 500);
 *   <textarea onChange={(e) => savePrompt(e.target.value)} />
 *
 * The returned function is stable across renders (callbacks accumulate in
 * a ref, so React Strict Mode's double-invoke doesn't cause double saves).
 */

import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  delayMs: number,
): (...args: TArgs) => void {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest version of fn without re-creating the debouncer.
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  // Clear any pending invocation when unmounted.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: TArgs) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void fnRef.current(...args);
      }, delayMs);
    },
    [delayMs],
  );
}
