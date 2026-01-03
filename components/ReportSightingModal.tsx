
import React, { useState, useRef, useEffect } from 'react';
import { PetProfile, Geolocation, Sighting, PhotoWithMarks } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { Modal } from './Modal';

declare var L: any;

interface ReportSightingModalProps {
  pet: PetProfile;
  onClose: () => void;
  onConfirm: (sighting: Omit<Sighting, 'id'>) => void;
}

export const ReportSightingModal: React.FC<ReportSightingModalProps> = ({ pet, onClose, onConfirm }) => {
  const { t } = useTranslations();
  const { addSnackbar } = useSnackbar();
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<Geolocation | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let mapInstance: any;
    if (mapRef.current) {
        // attributionControl: false
        mapInstance = L.map(mapRef.current, { attributionControl: false }).setView([41.90, 12.49], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
        let marker: any;
        mapInstance.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            setSelectedLocation({ latitude: lat, longitude: lng });
            if (marker) {
                marker.setLatLng(e.latlng);
            } else {
                marker = L.marker(e.latlng).addTo(mapInstance);
            }
            mapInstance.setView(e.latlng, 13);
        });
    }
    return () => { mapInstance?.remove(); };
  }, []);

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm({
        location: selectedLocation,
        timestamp: Date.now(),
        notes,
      });
    } else {
      addSnackbar(t('noLocationSelected'), 'error');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={t('reportSightingTitle', { petName: pet.name })}>
      <p className="text-muted-foreground mb-4">{t('reportSightingDesc')}</p>
      <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-muted-foreground">{t('sightingLocationLabel')}</label>
            <div ref={mapRef} style={{ height: '250px', borderRadius: 'var(--radius)', zIndex: 0, cursor: 'crosshair', marginTop: '4px' }} />
        </div>
        <div>
            <label htmlFor="sighting-notes" className="block text-sm font-medium text-muted-foreground">{t('sightingNotesLabel')}</label>
            <textarea
                id="sighting-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="input-base mt-1"
                placeholder={t('sightingNotesPlaceholder')}
            ></textarea>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button onClick={onClose} className="btn btn-secondary">{t('cancelButton')}</button>
        <button onClick={handleConfirm} disabled={!selectedLocation} className="btn btn-primary">{t('confirmSightingButton')}</button>
      </div>
    </Modal>
  );
};
