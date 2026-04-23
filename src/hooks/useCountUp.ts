import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp - Animated counter hook
 *
 * Animates a number from 0 to target value with easing
 * Respects prefers-reduced-motion
 *
 * @param target - Target number to count to
 * @param duration - Animation duration in ms (default: 2000)
 * @param delay - Delay before starting animation (default: 0)
 * @returns Current count value
 *
 * @example
 * const count = useCountUp(1234, 2000, 500);
 * return <div>{count}</div>
 */
export function useCountUp(
    target: number,
    duration: number = 2000,
    delay: number = 0
): number {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const frameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        // Check for reduced motion preference
        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            // Skip animation, show final value immediately
            setCount(target);
            return;
        }

        // Delay start if specified
        const delayTimeout = setTimeout(() => {
            setHasStarted(true);
        }, delay);

        return () => clearTimeout(delayTimeout);
    }, [target, delay]);

    useEffect(() => {
        if (!hasStarted) return;

        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (startTimeRef.current === 0) {
                startTimeRef.current = timestamp;
            }

            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);

            const currentCount = Math.floor(easeOutCubic * target);
            setCount(currentCount);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(target); // Ensure we end exactly on target
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [hasStarted, target, duration]);

    return count;
}

/**
 * Format number with K/M suffixes
 *
 * @example
 * formatNumber(1234) => "1.2K"
 * formatNumber(847) => "847"
 * formatNumber(5600) => "5.6K"
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}
