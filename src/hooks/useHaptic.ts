import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [50, 50, 100],
    error: [50, 30, 50, 30, 50],
    warning: [30, 50, 30],
    selection: 5,
};

/**
 * Custom hook for haptic feedback on mobile devices
 * Falls back silently on unsupported devices
 * 
 * @example
 * const { trigger } = useHaptic();
 * 
 * <button onClick={() => { trigger('success'); doSomething(); }}>
 *   Submit
 * </button>
 */
export function useHaptic() {
    const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    const trigger = useCallback((pattern: HapticPattern = 'light') => {
        if (!isSupported) return;

        try {
            navigator.vibrate(patterns[pattern]);
        } catch {
            // Silently fail - some browsers block vibration
        }
    }, [isSupported]);

    const cancel = useCallback(() => {
        if (!isSupported) return;

        try {
            navigator.vibrate(0);
        } catch {
            // Silently fail
        }
    }, [isSupported]);

    return {
        isSupported,
        trigger,
        cancel,
    };
}

/**
 * Utility function for one-off haptic feedback (no hook needed)
 */
export function triggerHaptic(pattern: HapticPattern = 'light'): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
            navigator.vibrate(patterns[pattern]);
        } catch {
            // Silently fail
        }
    }
}

export default useHaptic;
