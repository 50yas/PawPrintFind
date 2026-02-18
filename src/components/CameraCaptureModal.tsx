import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Modal } from './Modal';
import { useTranslations } from '../hooks/useTranslations';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
  const { t } = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access the camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    // Ensure camera stops when component unmounts
    return () => stopCamera();
  }, [stopCamera]);

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) {
            onCapture(blob);
            onClose();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Capture Image">
      <div className="space-y-4">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-muted" />
        )}
        <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn btn-secondary">{t('cancelButton')}</button>
            <button onClick={handleCapture} disabled={!stream || !!error} className="btn btn-primary">Capture</button>
        </div>
      </div>
    </Modal>
  );
};
