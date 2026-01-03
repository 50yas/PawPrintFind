import React, { useState } from 'react';
import { PetProfile, Geolocation } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { SearchAreaMap } from './SearchAreaMap';
import { Modal } from './Modal';

interface ReportLostModalProps {
    pet: PetProfile;
    onConfirm: (location: Geolocation, radius: number) => void;
    onClose: () => void;
}

export const ReportLostModal: React.FC<ReportLostModalProps> = ({ pet, onConfirm, onClose }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [area, setArea] = useState<{ center: Geolocation, radius: number } | null>(null);

    const handleConfirm = () => {
        if (area) {
            onConfirm(area.center, area.radius);
        } else {
            addSnackbar(t('noLocationSelected'), 'error');
        }
    }

    return (
        <Modal isOpen={true} onClose={onClose} title={t('reportLostModalTitle', { petName: pet.name })}>
            <p className="text-muted-foreground mt-2 mb-4">{t('reportLostModalDesc')}</p>
            <SearchAreaMap onAreaChange={(center, radius) => setArea({ center, radius })} />
            <div className="mt-6 flex justify-end space-x-3">
                <button onClick={onClose} className="btn btn-secondary">{t('cancelButton')}</button>
                <button onClick={handleConfirm} disabled={!area} className="btn btn-primary !bg-red-600 hover:!bg-red-700">
                    {t('confirmLocationButton')}
                </button>
            </div>
        </Modal>
    )
}
