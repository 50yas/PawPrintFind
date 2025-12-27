import React, { useState } from 'react';
import { PetProfile } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Modal } from './Modal';

interface SharePetModalProps {
  pet: PetProfile;
  friends: string[];
  onClose: () => void;
  onShare: (pet: PetProfile, friendEmails: string[]) => void;
}

export const SharePetModal: React.FC<SharePetModalProps> = ({ pet, friends, onClose, onShare }) => {
  const { t } = useTranslations();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handleToggleFriend = (email: string) => {
    setSelectedFriends(prev => 
      prev.includes(email) ? prev.filter(f => f !== email) : [...prev, email]
    );
  };
  
  const handleShare = () => {
    if (selectedFriends.length > 0) {
        onShare(pet, selectedFriends);
        onClose();
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={t('sharePetTitle', { petName: pet.name })}>
        <p className="text-muted-foreground mb-4">{t('sharePetDesc')}</p>
        {friends.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {friends.map(friendEmail => (
                    <label key={friendEmail} className="flex items-center space-x-3 p-2 bg-muted rounded-md cursor-pointer hover:bg-border">
                        <input
                            type="checkbox"
                            checked={selectedFriends.includes(friendEmail)}
                            onChange={() => handleToggleFriend(friendEmail)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-card-foreground">{friendEmail}</span>
                    </label>
                ))}
            </div>
        ) : (
            <p className="text-muted-foreground text-center py-4">{t('noFriendsToShare')}</p>
        )}
        <div className="mt-6 flex justify-end">
            <button
                onClick={handleShare}
                disabled={selectedFriends.length === 0}
                className="btn btn-primary"
            >
                {t('shareWithFriendsButton')}
            </button>
        </div>
    </Modal>
  );
};
