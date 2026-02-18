import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFirestoreSubscriptionOptions {
    /** Enable/disable the subscription */
    enabled?: boolean;
    /** Callback when data changes */
    onData?: <T>(data: T[]) => void;
    /** Callback when error occurs */
    onError?: (error: Error) => void;
}

interface UseFirestoreSubscriptionResult<T> {
    data: T[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => void;
}

/**
 * Custom hook for Firestore real-time subscriptions
 * Handles loading states, error handling, and cleanup automatically
 * 
 * @example
 * const { data: pets, isLoading, error } = useFirestoreSubscription(
 *   (callback) => dbService.subscribeToPets(callback)
 * );
 */
export function useFirestoreSubscription<T>(
    subscribeFn: (callback: (data: T[]) => void, onError?: (error: Error) => void) => () => void,
    options: UseFirestoreSubscriptionOptions = {}
): UseFirestoreSubscriptionResult<T> {
    const { enabled = true, onData, onError } = options;

    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const mountedRef = useRef(true);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    const handleData = useCallback((newData: T[]) => {
        if (!mountedRef.current) return;

        setData(newData);
        setIsLoading(false);
        setError(null);
        onData?.(newData);
    }, [onData]);

    const handleError = useCallback((err: Error) => {
        if (!mountedRef.current) return;

        console.error('[useFirestoreSubscription] Error:', err);
        setError(err);
        setIsLoading(false);
        onError?.(err);
    }, [onError]);

    const refresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    useEffect(() => {
        mountedRef.current = true;

        if (!enabled) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            unsubscribeRef.current = subscribeFn(handleData, handleError);
        } catch (err) {
            handleError(err instanceof Error ? err : new Error(String(err)));
        }

        return () => {
            mountedRef.current = false;
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [subscribeFn, enabled, handleData, handleError, refreshKey]);

    return { data, isLoading, error, refresh };
}

/**
 * Hook for single document subscription
 */
export function useFirestoreDoc<T>(
    subscribeFn: (callback: (data: T | null) => void, onError?: (error: Error) => void) => () => void,
    options: UseFirestoreSubscriptionOptions = {}
): { data: T | null; isLoading: boolean; error: Error | null; refresh: () => void } {
    const { enabled = true, onError } = options;

    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const mountedRef = useRef(true);

    const refresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    useEffect(() => {
        mountedRef.current = true;

        if (!enabled) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        let unsubscribe: (() => void) | null = null;

        try {
            unsubscribe = subscribeFn(
                (newData) => {
                    if (!mountedRef.current) return;
                    setData(newData);
                    setIsLoading(false);
                    setError(null);
                },
                (err) => {
                    if (!mountedRef.current) return;
                    setError(err);
                    setIsLoading(false);
                    onError?.(err);
                }
            );
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsLoading(false);
        }

        return () => {
            mountedRef.current = false;
            unsubscribe?.();
        };
    }, [subscribeFn, enabled, onError, refreshKey]);

    return { data, isLoading, error, refresh };
}

export default useFirestoreSubscription;
