import React, { useState } from 'react';
import { PetProfile } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Modal } from './Modal';

interface TransferOwnershipModalProps {
  pet: PetProfile;
  onClose: () => void;
  onConfirm: (newOwnerEmail: string) => void;
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({ pet, onClose, onConfirm }) => {
  const { t } = useTranslations();
  const [newOwnerEmail, setNewOwnerEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOwnerEmail.trim()) {
      onConfirm(newOwnerEmail.trim());
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={t('transferOwnershipTitle', { petName: pet.name })}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-muted-foreground">{t('transferOwnershipDesc')}</p>
        <div>
          <label htmlFor="new-owner-email" className="block text-sm font-medium text-muted-foreground">
            {t('newOwnerEmailLabel')}
          </label>
          <input
            id="new-owner-email"
            type="email"
            value={newOwnerEmail}
            onChange={(e) => setNewOwnerEmail(e.target.value)}
            className="input-base mt-1"
            placeholder="new.owner@example.com"
            required
            autoFocus
          />
        </div>
        <div className="pt-2 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">{t('cancelButton')}</button>
          <button type="submit" className="btn btn-primary">{t('confirmTransferButton')}</button>
        </div>
      </form>
    </Modal>
  );
};
