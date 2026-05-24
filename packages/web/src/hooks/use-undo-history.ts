/**
 * useUndoHistory — generic in-session undo/redo over a React state snapshot.
 *
 * Usage:
 *   const { undo, redo, canUndo, canRedo } = useUndoHistory({
 *     value: { nodes, edges },               // current snapshot
 *     restore: (snap) => {                   // how to apply a snapshot
 *       setNodes(snap.nodes);
 *       setEdges(snap.edges);
 *     },
 *     equals?: (a, b) => deepEqual(a, b),    // optional dedup
 *     debounceMs?: 300,                      // coalesce micro-changes
 *     capacity?: 50,                         // cap the past stack
 *     enabled?: true,                        // disable during initial load
 *   });
 *
 * Two design choices worth knowing:
 *
 *   1. **Debounce coalescing.** Dragging a React Flow node emits a stream
 *      of `onNodesChange` events (one per frame). We don't want one undo
 *      per frame — we want one undo per drag. The hook waits `debounceMs`
 *      of quiet time before committing the current `value` as a new entry.
 *
 *   2. **Restore guard.** Calling `restore(snap)` flips React state, which
 *      then re-fires the snapshot watcher. The hook ignores the next
 *      value change after an undo/redo to avoid pushing the restored
 *      snapshot back onto the stack (which would make redo behave weird
 *      and inflate the stack with no-op entries).
 */

import { useCallback, useEffect, useRef, useState } from "react";


export type UndoHistoryOptions<T> = {
  value: T;
  restore: (snapshot: T) => void;
  equals?: (a: T, b: T) => boolean;
  debounceMs?: number;
  capacity?: number;
  /**
   * When false, no snapshots are captured and undo/redo are inert.
   * Useful while a parent is hydrating state from the server — you don't
   * want the load to count as an undo-able step.
   */
  enabled?: boolean;
};


export type UndoHistoryHandle = {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Drop the history. Useful when switching projects. */
  reset: () => void;
};


const defaultEquals = <T,>(a: T, b: T): boolean => {
  // Cheap structural equality. Works for the workflow snapshot (plain
  // objects, arrays of plain objects). Not for class instances / Maps /
  // Sets. JSON.stringify-based for simplicity — at ~50 nodes the cost is
  // negligible (~ms), and the dedup avoids a lot of useless work.
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};


export function useUndoHistory<T>({
  value,
  restore,
  equals = defaultEquals,
  debounceMs = 300,
  capacity = 50,
  enabled = true,
}: UndoHistoryOptions<T>): UndoHistoryHandle {
  // We keep past/future as refs so the watcher effect doesn't re-fire on
  // every push. `tick` is a counter we bump after every mutation just to
  // force a re-render of `canUndo`/`canRedo`.
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const presentRef = useRef<T>(value);
  const [, setTick] = useState(0);
  const tick = useCallback(() => setTick((n) => n + 1), []);

  // Suppress capture when we're the ones who just called restore().
  const restoringRef = useRef(false);
  // Debounce timer.
  const timerRef = useRef<number | null>(null);

  // ── capture changes to `value` (debounced) ──────────────────────────
  useEffect(() => {
    if (!enabled) return;
    if (restoringRef.current) {
      // We just restored a snapshot — accept the resulting `value` as the
      // new present without pushing it onto the past stack.
      presentRef.current = value;
      restoringRef.current = false;
      return;
    }
    if (equals(value, presentRef.current)) return;

    // Hold the latest value and wait for the user to stop changing it.
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      // Commit: push the previous present onto past, swap in the new value.
      const prev = presentRef.current;
      // The value might've changed again since the timer started — read fresh.
      pastRef.current.push(prev);
      if (pastRef.current.length > capacity) pastRef.current.shift();
      // A fresh user edit invalidates the redo branch.
      futureRef.current = [];
      presentRef.current = value;
      tick();
    }, debounceMs);

    return () => {
      // Don't cancel on every re-render — we WANT the latest pending
      // commit to fire. Only cancel when the component unmounts or enabled
      // flips off (handled in a separate effect below).
    };
  }, [value, enabled, equals, debounceMs, capacity, tick]);

  // Flush pending timer on unmount / disable so we don't leak a setTimeout.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // ── undo / redo / reset ─────────────────────────────────────────────
  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    // If there's a pending debounced commit, flush it as the present so we
    // don't lose recent edits to the undo.
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const prev = pastRef.current.pop()!;
    futureRef.current.push(presentRef.current);
    presentRef.current = prev;
    restoringRef.current = true;
    restore(prev);
    tick();
  }, [restore, tick]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const next = futureRef.current.pop()!;
    pastRef.current.push(presentRef.current);
    presentRef.current = next;
    restoringRef.current = true;
    restore(next);
    tick();
  }, [restore, tick]);

  const reset = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    presentRef.current = value;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    tick();
    // value intentionally excluded from deps — reset is a manual call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return {
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    reset,
  };
}
