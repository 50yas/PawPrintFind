import React, { useState, useRef } from 'react';
import { PetProfile } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Modal } from './Modal';
import { AIIdentikitCard } from './AIIdentikitCard';
import html2canvas from 'html2canvas';

interface SharePetModalProps {
  pet: PetProfile;
  friends: string[];
  onClose: () => void;
  onShare: (pet: PetProfile, friendEmails: string[]) => void;
}

export const SharePetModal: React.FC<SharePetModalProps> = ({ pet, friends, onClose, onShare }) => {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState<'friends' | 'social'>('social'); // Default to social for engagement
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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
  };

  const handleDownloadStory = async () => {
      if (!cardRef.current) return;
      setIsCapturing(true);
      try {
          const canvas = await html2canvas(cardRef.current, { 
              backgroundColor: null, 
              scale: 2, // High res for retina
              useCORS: true // Important for external images
          });
          const link = document.createElement('a');
          link.download = `pawprint-identikit-${pet.name}.png`;
          link.href = canvas.toDataURL('image/png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch (error) {
          console.error("Capture failed:", error);
      } finally {
          setIsCapturing(false);
      }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={t('sharePetTitle', { petName: pet.name })}>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
            <button 
                onClick={() => setActiveTab('social')}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'social' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                Instagram / TikTok
            </button>
            <button 
                onClick={() => setActiveTab('friends')}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'friends' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                {t('shareWithFriendsButton')}
            </button>
        </div>

        {activeTab === 'friends' ? (
            <>
                <p className="text-slate-400 mb-4">{t('sharePetDesc')}</p>
                {friends.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {friends.map(friendEmail => (
                            <label key={friendEmail} className="flex items-center space-x-3 p-2 bg-white/5 rounded-md cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={selectedFriends.includes(friendEmail)}
                                    onChange={() => handleToggleFriend(friendEmail)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-white">{friendEmail}</span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-center py-4">{t('noFriendsToShare')}</p>
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
            </>
        ) : (
            <div className="flex flex-col items-center space-y-6">
                <div className="text-center space-y-1">
                    <h3 className="text-sm font-medium text-white">AI Biometric Card</h3>
                    <p className="text-xs text-slate-400">Perfect for Instagram Stories or TikTok.</p>
                </div>

                {/* Capture Area */}
                <div className="relative p-1">
                    <div ref={cardRef}>
                        <AIIdentikitCard pet={pet} />
                    </div>
                </div>

                <button
                    onClick={handleDownloadStory}
                    disabled={isCapturing}
                    className="glass-btn w-full flex items-center justify-center gap-2"
                >
                    {isCapturing ? (
                        <>Processing...</>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Download for Story
                        </>
                    )}
                </button>

                <div className="w-full text-center p-3 bg-fuchsia-900/20 border border-fuchsia-500/30 rounded-lg animate-pulse">
                    <p className="text-xs text-fuchsia-200">
                        💡 <strong>Challenge:</strong> Share this to your story with <span className="text-fuchsia-400 font-bold">#PawPrintChallenge</span> to earn the "Neighborhood Hero" badge!
                    </p>
                </div>
            </div>
        )}
    </Modal>
  );
};
