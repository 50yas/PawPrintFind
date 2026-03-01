/**
 * useTapIntent — Distinguishes intentional taps from scroll gestures on mobile.
 *
 * Problem: `onPointerDown` / `onClick` on cards fires even during scroll,
 * causing accidental navigation on mobile.
 *
 * Solution: Track touch start position. On pointer-up, only invoke the callback
 * if:
 *   1. The pointer moved less than SCROLL_THRESHOLD pixels (not a scroll)
 *   2. The gesture took less than MAX_TAP_DURATION_MS (not a long-press)
 *
 * Also suppresses native click events that fire ~300ms after touchend to avoid
 * double invocation.
 *
 * Usage:
 *   const { onPointerDown, onPointerUp, onPointerCancel } = useTapIntent(handler);
 *   <div {...tapProps} />
 */

import { useCallback, useRef } from 'react';

const SCROLL_THRESHOLD = 10; // px — movement above this = scroll intent
const MAX_TAP_DURATION_MS = 400; // ms — longer than this = long-press, ignore

interface TapIntentHandlers {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onClick: (e: React.MouseEvent) => void;
}

export function useTapIntent(
    callback: (() => void) | undefined,
    options: { disabled?: boolean } = {}
): TapIntentHandlers {
    const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
    const suppressNextClickRef = useRef(false);

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (options.disabled || !callback) return;
            // Only track primary pointer (finger / left mouse button)
            if (!e.isPrimary) return;
            startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
        },
        [callback, options.disabled]
    );

    const onPointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (options.disabled || !callback || !startRef.current) return;
            if (!e.isPrimary) return;

            const dx = Math.abs(e.clientX - startRef.current.x);
            const dy = Math.abs(e.clientY - startRef.current.y);
            const dt = Date.now() - startRef.current.t;
            startRef.current = null;

            const isScroll = dx > SCROLL_THRESHOLD || dy > SCROLL_THRESHOLD;
            const isLongPress = dt > MAX_TAP_DURATION_MS;

            if (!isScroll && !isLongPress) {
                // Valid tap — suppress the synthetic click that follows touchend
                suppressNextClickRef.current = true;
                callback();
                setTimeout(() => { suppressNextClickRef.current = false; }, 600);
            }
        },
        [callback, options.disabled]
    );

    const onPointerCancel = useCallback((_e: React.PointerEvent) => {
        startRef.current = null;
    }, []);

    // Suppress the 300ms synthetic click that some browsers fire after touch
    const onClick = useCallback(
        (e: React.MouseEvent) => {
            if (suppressNextClickRef.current) {
                e.preventDefault();
                e.stopPropagation();
                suppressNextClickRef.current = false;
            }
        },
        []
    );

    return { onPointerDown, onPointerUp, onPointerCancel, onClick };
}
