import React, { useState, useMemo } from 'react';
import { PetProfile, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { SharePetModal } from './SharePetModal';
import { CinematicImage } from './ui/CinematicImage';

interface CommunityProps {
    currentUser: User;
    allUsers: User[];
    allPets: PetProfile[];
    onRegisterStray: () => void;
    onFriendRequest: (toEmail: string) => void;
    onFriendResponse: (fromEmail: string, accept: boolean) => void;
    onSharePet: (pet: PetProfile, friendEmails: string[]) => void;
    goToDashboard: () => void;
}

const PetCard: React.FC<{ pet: PetProfile, onShare: (pet: PetProfile) => void, isGuardian: boolean }> = ({ pet, onShare, isGuardian }) => {
    const { t } = useTranslations();
    const statusColor = pet.isLost ? 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30' : 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30';
    
    return (
        <div className="bg-card rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-lg">
            <div className="md:flex">
                <div className="md:flex-shrink-0 w-full md:w-48 h-48">
                    <CinematicImage src={pet.photos[0]?.url} alt={pet.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-2xl font-bold text-card-foreground">{pet.name}</h3>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColor}`}>{pet.isLost ? t('statusLost') : t('statusSafe')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{pet.breed}</p>
                        <p className="text-xs text-muted-foreground mt-2">{t('guardians')}: {pet.guardianEmails.length}</p>
                    </div>
                    <div className="mt-4 flex flex-row items-center justify-end gap-3">
                        {isGuardian && <button className="btn btn-ghost !py-1 !px-2 text-sm">{t('editButton')}</button>}
                        <button onClick={() => onShare(pet)} className="btn btn-secondary !py-2 !px-4 text-sm">{t('shareButton')}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const Community: React.FC<CommunityProps> = ({
    currentUser, allUsers, allPets, onRegisterStray, onFriendRequest, onFriendResponse, onSharePet, goToDashboard
}) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState('animals');
    const [friendSearch, setFriendSearch] = useState('');
    const [sharingPet, setSharingPet] = useState<PetProfile | null>(null);

    const communityPets = allPets.filter(p => p.status === 'stray');
    const friendRequestUsers = currentUser.friendRequests.map(req => allUsers.find(u => u.email === req.from)).filter(Boolean) as User[];
    
    const leaderboardUsers = useMemo(() => {
        return [...allUsers].sort((a, b) => b.points - a.points).slice(0, 10);
    }, [allUsers]);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {sharingPet && <SharePetModal pet={sharingPet} friends={currentUser.friends} onClose={() => setSharingPet(null)} onShare={onSharePet} />}
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-foreground">{t('communityHubButton')}</h1>
                <button onClick={goToDashboard} className="btn btn-secondary">&larr; {t('dashboardButton')}</button>
            </div>

            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('animals')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'animals' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>{t('communityAnimalsTitle')}</button>
                    <button onClick={() => setActiveTab('leaderboard')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'leaderboard' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>{t('leaderboardTitle')}</button>
                    <button onClick={() => setActiveTab('friends')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'friends' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>{t('myFriendsTitle')}</button>
                    <button onClick={() => setActiveTab('requests')} className={`relative whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
                        {t('friendRequestsTitle')}
                        {currentUser.friendRequests.length > 0 && <span className="ml-2 absolute top-2 -right-3 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{currentUser.friendRequests.length}</span>}
                    </button>
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'animals' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground">{t('communityAnimalsDesc')}</p>
                            <button onClick={onRegisterStray} className="btn btn-primary">{t('registerStrayButton')}</button>
                        </div>
                        {communityPets.length > 0 ? (
                             communityPets.map(pet => <PetCard key={pet.id} pet={pet} onShare={setSharingPet} isGuardian={pet.guardianEmails.includes(currentUser.email)} />)
                        ) : (
                            <p className="text-center py-8 text-muted-foreground">No community animals registered yet.</p>
                        )}
                    </div>
                )}
                {activeTab === 'leaderboard' && (
                    <div className="bg-card p-6 rounded-xl shadow-md">
                        <h3 className="text-2xl font-bold mb-1 text-card-foreground">{t('leaderboardTitle')}</h3>
                        <p className="text-muted-foreground mb-6">{t('leaderboardDesc')}</p>
                        <ul className="space-y-3">
                            {leaderboardUsers.map((user, index) => (
                                <li key={user.email} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <span className={`font-bold text-lg w-8 text-center ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>{index + 1}</span>
                                        <span className="font-semibold text-card-foreground">{user.email}</span>
                                    </div>
                                    <span className="font-bold text-primary">{user.points} {t('points')}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {activeTab === 'friends' && (
                    <div className="bg-card p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold mb-4">{t('addFriendTitle')}</h3>
                        <div className="flex gap-2">
                            <input type="email" value={friendSearch} onChange={e => setFriendSearch(e.target.value)} placeholder={t('searchUserByEmailPlaceholder')} className="input-base flex-grow" />
                            <button onClick={() => onFriendRequest(friendSearch)} className="btn btn-primary">{t('addFriendButton')}</button>
                        </div>
                        <h3 className="text-xl font-bold mt-8 mb-4">{t('myFriendsTitle')}</h3>
                        {currentUser.friends.length > 0 ? (
                            <ul className="divide-y divide-border">
                                {currentUser.friends.map(email => <li key={email} className="py-2 text-muted-foreground">{email}</li>)}
                            </ul>
                        ) : <p className="text-muted-foreground">{t('noFriendsYet')}</p>}
                    </div>
                )}
                 {activeTab === 'requests' && (
                    <div className="bg-card p-6 rounded-xl shadow-md">
                         <h3 className="text-xl font-bold mb-4">{t('friendRequestsTitle')}</h3>
                         {friendRequestUsers.length > 0 ? (
                            <ul className="divide-y divide-border">
                                {friendRequestUsers.map(user => (
                                    <li key={user.email} className="py-3 flex justify-between items-center">
                                        <p className="text-card-foreground font-semibold">{user.email}</p>
                                        <div className="flex space-x-2">
                                            <button onClick={() => onFriendResponse(user.email, false)} className="btn btn-secondary !py-1 !px-3 text-sm">{t('declineButton')}</button>
                                            <button onClick={() => onFriendResponse(user.email, true)} className="btn !bg-green-600 !text-white !py-1 !px-3 text-sm">{t('acceptButton')}</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                         ) : <p className="text-muted-foreground">{t('noFriendRequests')}</p>}
                    </div>
                )}
            </div>
        </div>
    )
}