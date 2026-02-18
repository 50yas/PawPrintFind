import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFormDraftOptions<T> {
    /** Unique key for this form draft */
    key: string;
    /** Initial form values (used when no draft exists) */
    initialValues: T;
    /** Debounce delay in ms for auto-save (default: 2000) */
    debounceMs?: number;
    /** Maximum age of draft in ms before it's considered stale (default: 24 hours) */
    maxAgeMs?: number;
    /** Callback when draft is restored */
    onRestore?: (draft: T) => void;
}

interface UseFormDraftResult<T> {
    /** Whether a draft was found on mount */
    hasDraft: boolean;
    /** Current draft timestamp */
    draftTimestamp: number | null;
    /** Restore the saved draft */
    restoreDraft: () => void;
    /** Discard the saved draft */
    discardDraft: () => void;
    /** Manually save current values as draft */
    saveDraft: (values: T) => void;
    /** Clear draft (call after successful form submission) */
    clearDraft: () => void;
    /** Update draft with debounce */
    updateDraft: (values: T) => void;
}

interface DraftData<T> {
    values: T;
    timestamp: number;
    version: number;
}

const DRAFT_VERSION = 1;

/**
 * Custom hook for auto-saving form drafts to localStorage
 * Prevents data loss on accidental navigation or page refresh
 * 
 * @example
 * const { hasDraft, restoreDraft, discardDraft, updateDraft, clearDraft } = useFormDraft({
 *   key: 'pet-registration',
 *   initialValues: { name: '', breed: '' },
 *   onRestore: (draft) => {
 *     setName(draft.name);
 *     setBreed(draft.breed);
 *   }
 * });
 */
export function useFormDraft<T extends Record<string, unknown>>(
    options: UseFormDraftOptions<T>
): UseFormDraftResult<T> {
    const { key, initialValues, debounceMs = 2000, maxAgeMs = 24 * 60 * 60 * 1000, onRestore } = options;

    const storageKey = `paw-print-draft-${key}`;

    const [hasDraft, setHasDraft] = useState(false);
    const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
    const [cachedDraft, setCachedDraft] = useState<T | null>(null);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Check for existing draft on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed: DraftData<T> = JSON.parse(stored);

                // Check if draft is not too old and has correct version
                const age = Date.now() - parsed.timestamp;
                if (age < maxAgeMs && parsed.version === DRAFT_VERSION) {
                    setHasDraft(true);
                    setDraftTimestamp(parsed.timestamp);
                    setCachedDraft(parsed.values);
                } else {
                    // Draft is stale, remove it
                    localStorage.removeItem(storageKey);
                }
            }
        } catch (err) {
            console.warn('[useFormDraft] Failed to read draft:', err);
            localStorage.removeItem(storageKey);
        }
    }, [storageKey, maxAgeMs]);

    const saveDraft = useCallback((values: T) => {
        try {
            const draftData: DraftData<T> = {
                values,
                timestamp: Date.now(),
                version: DRAFT_VERSION,
            };
            localStorage.setItem(storageKey, JSON.stringify(draftData));
            setDraftTimestamp(draftData.timestamp);
        } catch (err) {
            console.warn('[useFormDraft] Failed to save draft:', err);
        }
    }, [storageKey]);

    const updateDraft = useCallback((values: T) => {
        // Cancel pending save
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Schedule new save
        debounceTimerRef.current = setTimeout(() => {
            saveDraft(values);
        }, debounceMs);
    }, [saveDraft, debounceMs]);

    const restoreDraft = useCallback(() => {
        if (cachedDraft && onRestore) {
            onRestore(cachedDraft);
            setHasDraft(false);
        }
    }, [cachedDraft, onRestore]);

    const discardDraft = useCallback(() => {
        localStorage.removeItem(storageKey);
        setHasDraft(false);
        setDraftTimestamp(null);
        setCachedDraft(null);
    }, [storageKey]);

    const clearDraft = useCallback(() => {
        // Cancel any pending save
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        discardDraft();
    }, [discardDraft]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        hasDraft,
        draftTimestamp,
        restoreDraft,
        discardDraft,
        saveDraft,
        clearDraft,
        updateDraft,
    };
}

export default useFormDraft;
