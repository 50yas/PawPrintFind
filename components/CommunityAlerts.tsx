import React from 'react';
import { PetProfile, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { EmojiSwitcher } from './EmojiSwitcher';

interface CommunityAlertsProps {
  alerts: PetProfile[];
  currentUser: User;
  onReportSighting: (pet: PetProfile) => void;
}

export const CommunityAlerts: React.FC<CommunityAlertsProps> = ({ alerts, currentUser, onReportSighting }) => {
  const { t } = useTranslations();

  // Filter out alerts for the current user's own pets
  const relevantAlerts = alerts.filter(pet => pet.ownerEmail !== currentUser.email);

  if (relevantAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[90] space-y-2">
      {relevantAlerts.map(pet => (
        <div key={pet.id} className="community-alert-toast bg-white/5 backdrop-blur-xl p-3 rounded-lg shadow-2xl flex items-center space-x-3 max-w-sm border border-white/10">
          <img src={pet.photos[0]?.url} alt={pet.name} className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
          <div className="flex-grow">
            <p className="text-sm font-bold text-red-500">{t('lostNearby')}</p>
            <p className="text-white font-semibold">{pet.name}</p>
          </div>
          <EmojiSwitcher 
            onClick={() => onReportSighting(pet)} 
            className="glass-btn !py-1 !px-2 text-xs flex-shrink-0 !w-auto !h-auto !rounded-lg"
          >
            {t('reportSightingButton')}
          </EmojiSwitcher>
        </div>
      ))}
    </div>
  );
};