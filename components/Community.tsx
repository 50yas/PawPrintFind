import React, { useState, useMemo } from 'react';
import { PetProfile, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { SharePetModal } from './SharePetModal';
import { PetCard } from './PetCard';

interface CommunityProps {
    currentUser: User;
    allUsers: User[];
    allPets: PetProfile[];
    onRegisterStray: () => void;
    onFriendRequest: (toEmail: string) => void;
    onFriendResponse: (fromEmail: string, accept: boolean) => void;
    onSharePet: (pet: PetProfile, friendEmails: string[]) => void;
    onViewPet: (pet: PetProfile) => void;
    goToDashboard: () => void;
}

export const Community: React.FC<CommunityProps> = ({
    currentUser, allUsers, allPets, onRegisterStray, onFriendRequest, onFriendResponse, onSharePet, onViewPet, goToDashboard
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
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{t('communityHubButton')}</h1>
                    <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">{t('communityAnimalsDesc')}</p>
                </div>
                <button onClick={goToDashboard} className="glass-btn text-sm">&larr; {t('dashboardButton')}</button>
            </div>

            <div className="border-b border-white/10">
                <nav className="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto hide-scrollbar" aria-label="Tabs">
                    {[
                        { id: 'animals', label: t('communityAnimalsTitle') },
                        { id: 'leaderboard', label: t('leaderboardTitle') },
                        { id: 'friends', label: t('myFriendsTitle') },
                        { id: 'requests', label: t('friendRequestsTitle'), badge: currentUser.friendRequests.length },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative whitespace-nowrap py-3 px-3 sm:px-4 border-b-2 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5 rounded-t-lg'}`}
                        >
                            {tab.label}
                            {tab.badge && tab.badge > 0 && <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full neon-glow-red">{tab.badge}</span>}
                        </button>
                    ))}
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
                             communityPets.map(pet => (
                                <PetCard 
                                    variant="community" 
                                    key={pet.id} 
                                    pet={pet} 
                                    onShare={setSharingPet} 
                                    onViewDetail={onViewPet}
                                    isGuardian={pet.guardianEmails.includes(currentUser.email)} 
                                />
                             ))
                        ) : (
                            <p className="text-center py-8 text-muted-foreground">No community animals registered yet.</p>
                        )}
                    </div>
                )}
                {activeTab === 'leaderboard' && (
                    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] pointer-events-none"></div>
                        <h3 className="text-2xl font-bold mb-1 text-white">{t('leaderboardTitle')}</h3>
                        <p className="text-slate-400 mb-6 text-sm">{t('leaderboardDesc')}</p>
                        <ul className="space-y-2">
                            {leaderboardUsers.map((user, index) => (
                                <li key={user.email} className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-white/5 ${index < 3 ? 'bg-primary/5 border-primary/20' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-mono font-bold text-lg w-8 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                        </span>
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary border border-primary/20">
                                            {user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-white text-sm truncate max-w-[200px]">{user.email}</span>
                                    </div>
                                    <span className="font-mono font-bold text-primary text-sm">{user.points.toLocaleString()} pts</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {activeTab === 'friends' && (
                    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                        <h3 className="text-xl font-bold mb-4 text-white">{t('addFriendTitle')}</h3>
                        <div className="flex gap-3">
                            <input type="email" value={friendSearch} onChange={e => setFriendSearch(e.target.value)} placeholder={t('searchUserByEmailPlaceholder')} className="input-base flex-grow" />
                            <button onClick={() => onFriendRequest(friendSearch)} className="btn btn-primary rounded-xl whitespace-nowrap">{t('addFriendButton')}</button>
                        </div>
                        <div className="cyber-divider my-8"></div>
                        <h3 className="text-xl font-bold mb-4 text-white">{t('myFriendsTitle')}</h3>
                        {currentUser.friends.length > 0 ? (
                            <ul className="space-y-2">
                                {currentUser.friends.map(email => (
                                    <li key={email} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{email.charAt(0).toUpperCase()}</div>
                                        <span className="text-slate-300 text-sm font-medium truncate">{email}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-slate-400 text-center py-8">{t('noFriendsYet')}</p>}
                    </div>
                )}
                 {activeTab === 'requests' && (
                    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                         <h3 className="text-xl font-bold mb-4 text-white">{t('friendRequestsTitle')}</h3>
                         {friendRequestUsers.length > 0 ? (
                            <ul className="space-y-3">
                                {friendRequestUsers.map(user => (
                                    <li key={user.email} className="p-4 flex justify-between items-center bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">{user.email.charAt(0).toUpperCase()}</div>
                                            <p className="text-white font-bold text-sm">{user.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => onFriendResponse(user.email, false)} className="glass-btn !py-2 !px-4 text-xs text-red-400">{t('declineButton')}</button>
                                            <button onClick={() => onFriendResponse(user.email, true)} className="btn btn-primary !py-2 !px-4 text-xs rounded-xl neon-glow-green">{t('acceptButton')}</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                         ) : <p className="text-slate-400 text-center py-8">{t('noFriendRequests')}</p>}
                    </div>
                )}
            </div>
        </div>
    )
}