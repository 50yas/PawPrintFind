
import React, { useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ThreeDModelViewerProps {
  modelUid: string;
  className?: string;
  autoStart?: boolean;
}

declare global {
  interface Window {
    Sketchfab: any;
  }
}

export const ThreeDModelViewer: React.FC<ThreeDModelViewerProps> = ({ modelUid, className = "", autoStart = true }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only initialize if the script is loaded
    if (typeof window.Sketchfab === 'undefined') {
      setError("Sketchfab API not loaded");
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) return;

    // Prevent re-initialization if already initialized on this iframe
    if ((iframe as any).dataset.initialized) return;

    try {
        const client = new window.Sketchfab(iframe);

        client.init(modelUid, {
          success: (api: any) => {
            (iframe as any).dataset.initialized = "true";
            
            if (autoStart) api.start();
            api.addEventListener('viewerready', () => {
              setIsReady(true);
              console.log('Sketchfab Viewer is ready');
            });
            api.addEventListener('error', () => {
                setError("Viewer runtime error");
            })
          },
          error: () => {
            setError("Failed to initialize Sketchfab viewer");
          },
          // Configuration for a clean, avatar-like appearance
          ui_controls: 0,
          ui_infos: 0,
          ui_stop: 0,
          ui_watermark: 0,
          ui_inspector: 0,
          ui_animations: 0,
          ui_annotations: 0,
          ui_general_controls: 0,
          ui_help: 0,
          ui_hint: 0,
          ui_vr: 0,
          ui_fullscreen: 0,
          transparent: 1, // Crucial for overlay/avatar look
          scrollwheel: 0, // Disable zoom on scroll
          preload: 1
        });
    } catch (e) {
        console.error("Sketchfab init error", e);
        setError("Init error");
    }

  }, [modelUid, autoStart]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: 'transparent' }}>
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LoadingSpinner />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-red-500 text-xs">{error}</p>
        </div>
      )}

      <iframe
        ref={iframeRef}
        title="3D Model"
        src=""
        className="w-full h-full border-0 focus:outline-none pointer-events-none" // Disable pointer events for purely visual avatar
        allow="autoplay; fullscreen; vr"
        allowFullScreen
      ></iframe>
    </div>
  );
};
