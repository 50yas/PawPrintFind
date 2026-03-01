import { useState, useEffect, useRef, useCallback } from 'react';
import { Geolocation } from '../types';

interface UseGeolocationOptions {
  watch?: boolean;
  highAccuracy?: boolean;
  maxAge?: number;
  timeout?: number;
}

export const useGeolocation = (options?: UseGeolocationOptions) => {
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trackHistory, setTrackHistory] = useState<Geolocation[]>([]);
  const watchIdRef = useRef<number | null>(null);

  const positionOptions: PositionOptions = {
    enableHighAccuracy: options?.highAccuracy ?? false,
    maximumAge: options?.maxAge ?? 0,
    timeout: options?.timeout ?? 10000,
  };

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const geo: Geolocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    setLocation(geo);
    setLoading(false);
    if (options?.watch) {
      setTrackHistory(prev => [...prev, geo]);
    }
  }, [options?.watch]);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(err.message);
    setLoading(false);
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, positionOptions);
  }, [handlePosition, handleError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    if (watchIdRef.current !== null) return; // already watching
    setLoading(true);
    setError(null);
    setTrackHistory([]);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      { ...positionOptions, enableHighAccuracy: true }
    );
  }, [handlePosition, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setTrackHistory([]);
  }, []);

  // Auto-start watch if option is set
  useEffect(() => {
    if (options?.watch) {
      startWatching();
    }
    return () => {
      stopWatching();
    };
  }, [options?.watch]);

  return { location, error, loading, getLocation, startWatching, stopWatching, trackHistory, clearHistory };
};
