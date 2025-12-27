
import React, { useState } from 'react';
import { PetProfile, Appointment } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Modal } from './Modal';

interface RequestAppointmentModalProps {
  pet: PetProfile;
  onClose: () => void;
  onSubmit: (appointment: Omit<Appointment, 'id' | 'status' | 'requestedBy'>) => void;
}

export const RequestAppointmentModal: React.FC<RequestAppointmentModalProps> = ({ pet, onClose, onSubmit }) => {
  const { t } = useTranslations();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet.vetEmail) {
        alert(t('petNotLinked'));
        return;
    }
    onSubmit({
      vetEmail: pet.vetEmail,
      petId: pet.id,
      petName: pet.name,
      date,
      time,
      notes,
    });
  };

  const labelStyles = "block text-sm font-medium text-muted-foreground";

  return (
    <Modal isOpen={true} onClose={onClose} title={t('requestAppointmentTitle')}>
      <p className="text-muted-foreground mb-4">{t('requestAppointmentDesc')}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label htmlFor="date" className={labelStyles}>{t('dateLabel')}</label>
            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="input-base mt-1" />
            </div>
            <div>
            <label htmlFor="time" className={labelStyles}>{t('timeLabel')}</label>
            <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} required className="input-base mt-1" />
            </div>
        </div>
        <div>
          <label htmlFor="reason" className={labelStyles}>{t('reasonForVisitLabel')}</label>
          <textarea 
            id="reason" 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            rows={3} 
            className="input-base mt-1"
            placeholder={t('reasonForVisitPlaceholder')}
            required
          ></textarea>
        </div>
        <div className="pt-2 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">{t('cancelButton')}</button>
            <button type="submit" className="btn btn-primary">{t('sendRequest')}</button>
        </div>
      </form>
    </Modal>
  );
};
