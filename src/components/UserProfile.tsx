import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, UserRole, View } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { dbService } from '../services/firebase';
import { auth } from '../services/firebase';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { GlassCard } from './ui/GlassCard';
import { LoadingSpinner } from './LoadingSpinner';
import { BadgeCard, BadgeShowcase } from './BadgeCard';
import { BADGES } from '../services/gamificationService';

const KARMA_TIER_COLORS: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    scout:    { color: '#94a3b8', bg: '#1e2433', label: 'Scout',    icon: '🔭' },
    tracker:  { color: '#34d399', bg: '#0d2318', label: 'Tracker',  icon: '🐾' },
    ranger:   { color: '#60a5fa', bg: '#0d1a2e', label: 'Ranger',   icon: '🌿' },
    guardian: { color: '#c084fc', bg: '#1a0d2e', label: 'Guardian', icon: '🛡️' },
    legend:   { color: '#fbbf24', bg: '#2e1d08', label: 'Legend',   icon: '👑' },
};

type ProfileTab = 'profile' | 'badges' | 'settings' | 'security';

interface UserProfileProps {
    currentUser: User;
    setCurrentUser: (u: User) => void;
    setView: (v: View) => void;
}

/**
 * Returns the appropriate dashboard view for the user's active role.
 */
function getDashboardView(role: UserRole): View {
    if (role === 'vet') return 'vetDashboard';
    if (role === 'shelter') return 'shelterDashboard';
    if (role === 'super_admin') return 'adminDashboard';
    return 'dashboard';
}

/**
 * Returns a short human-readable label for the dashboard link.
 */
function getDashboardLabel(role: UserRole): string {
    if (role === 'vet') return 'Vet Dashboard';
    if (role === 'shelter') return 'Shelter Dashboard';
    if (role === 'super_admin') return 'Admin Dashboard';
    return 'Dashboard';
}

/**
 * UserProfile — Mobile-first, Material Design 3 user profile screen.
 *
 * Features:
 * - Role-aware back navigation (vet → vetDashboard, shelter → shelterDashboard, etc.)
 * - Responsive hero card: stacked on mobile, side-by-side on sm+
 * - 2×2 tab grid on mobile, 4-column on sm+
 * - Responsive badge grids: 2 cols mobile, 3 cols sm, 4 cols md
 * - Full-width action buttons on mobile
 * - Safe-area bottom padding for devices with bottom navigation
 */
export const UserProfile: React.FC<UserProfileProps> = ({ currentUser, setCurrentUser, setView }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

    // Profile edit state
    const [displayName, setDisplayName] = useState(currentUser.displayName || '');
    const [bio, setBio] = useState(currentUser.bio || '');
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // Security state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    // Settings state
    const [notificationsEnabled, setNotificationsEnabled] = useState(currentUser.notificationsEnabled ?? true);

    const tier = currentUser.karmaTier || 'scout';
    const tierInfo = KARMA_TIER_COLORS[tier] || KARMA_TIER_COLORS.scout;
    const joinDate = currentUser.joinedAt
        ? new Date(currentUser.joinedAt).toLocaleDateString()
        : '—';
    const earnedBadges = currentUser.badges || [];

    const dashboardView = getDashboardView(currentUser.activeRole);
    const dashboardLabel = getDashboardLabel(currentUser.activeRole);

    // ─── Handlers ──────────────────────────────────────────────────────────────

    const handlePhotoUpload = useCallback(async (file: File) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            addSnackbar('Photo must be under 5MB', 'error');
            return;
        }
        setUploadingPhoto(true);
        try {
            // Path matches storage rule: match /users/{userId}/{allPaths=**}
            const fileRef = storageRef(
                storage,
                `users/${currentUser.uid}/profile/${Date.now()}_${file.name}`
            );
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            await dbService.updateUser({ ...currentUser, photoURL: url });
            if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
            const updated = { ...currentUser, photoURL: url };
            setCurrentUser(updated);
            addSnackbar('Profile photo updated!', 'success');
        } catch (e: any) {
            addSnackbar(e.message || 'Failed to upload photo', 'error');
        } finally {
            setUploadingPhoto(false);
        }
    }, [currentUser, setCurrentUser, addSnackbar]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const updates: Partial<User> = {
                displayName: displayName.trim(),
                bio: bio.trim(),
            };
            await dbService.updateUser({ ...currentUser, ...updates });
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: displayName.trim() });
            }
            setCurrentUser({ ...currentUser, ...updates });
            addSnackbar('Profile saved!', 'success');
        } catch (e: any) {
            addSnackbar(e.message || 'Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            addSnackbar('Passwords do not match', 'error');
            return;
        }
        if (newPassword.length < 6) {
            addSnackbar('Password must be at least 6 characters', 'error');
            return;
        }
        setChangingPassword(true);
        try {
            const user = auth.currentUser;
            if (!user || !user.email) throw new Error('No authenticated user');
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            addSnackbar('Password changed successfully!', 'success');
        } catch (e: any) {
            addSnackbar(e.message || 'Failed to change password', 'error');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await dbService.updateUser({ ...currentUser, notificationsEnabled });
            setCurrentUser({ ...currentUser, notificationsEnabled });
            addSnackbar('Settings saved!', 'success');
        } catch (e: any) {
            addSnackbar('Failed to save settings', 'error');
        }
    };

    // ─── Tab definitions ────────────────────────────────────────────────────────

    const tabs: { id: ProfileTab; label: string; icon: string }[] = [
        { id: 'profile',  label: t('profile',  'Profile'),  icon: '👤' },
        { id: 'badges',   label: t('badges',   'Badges'),   icon: '🏆' },
        { id: 'settings', label: t('settings', 'Settings'), icon: '⚙️' },
        { id: 'security', label: t('security', 'Security'), icon: '🔒' },
    ];

    // ─── Role emoji for avatar placeholder ─────────────────────────────────────

    const roleEmoji =
        currentUser.activeRole === 'vet'         ? '🩺' :
        currentUser.activeRole === 'shelter'      ? '🏠' :
        currentUser.activeRole === 'volunteer'    ? '🤝' :
        currentUser.activeRole === 'super_admin'  ? '⚡' : '🐾';

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32">

            {/* ── Sticky breadcrumb / back bar ── */}
            <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => setView(dashboardView)}
                    aria-label={`Go back to ${dashboardLabel}`}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider min-h-[44px] min-w-[44px] -ml-1 pl-1"
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden xs:inline">{dashboardLabel}</span>
                </button>
                <span className="text-slate-700" aria-hidden="true">•</span>
                <span className="text-white font-black text-sm uppercase tracking-wider truncate">
                    {t('myProfileAndBadges', 'My Profile')}
                </span>
            </div>

            {/* ── Page content ── */}
            <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-6">

                {/* ── Hero card ── */}
                <GlassCard className="p-4 sm:p-6 relative overflow-hidden">
                    {/* Tier gradient background */}
                    <div
                        className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle at 70% 30%, ${tierInfo.color}60, transparent 70%)`,
                        }}
                        aria-hidden="true"
                    />

                    {/*
                        Mobile:  flex-col, avatar centred, text centred
                        sm+:     flex-row, avatar left-aligned, text left-aligned
                    */}
                    <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-4 sm:gap-5">

                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => photoInputRef.current?.click()}
                                aria-label="Change profile photo"
                                className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 hover:border-white/30 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                                style={{ boxShadow: `0 0 20px ${tierInfo.color}30` }}
                            >
                                {uploadingPhoto ? (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                ) : currentUser.photoURL ? (
                                    <img
                                        src={currentUser.photoURL}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center text-3xl"
                                        style={{ background: tierInfo.bg }}
                                        aria-hidden="true"
                                    >
                                        {roleEmoji}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">Edit</span>
                                </div>
                            </button>

                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                            />

                            {/* Tier badge pip */}
                            <div
                                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-slate-950"
                                style={{
                                    background: tierInfo.bg,
                                    borderColor: `${tierInfo.color}60`,
                                }}
                                title={tierInfo.label}
                                aria-label={`Karma tier: ${tierInfo.label}`}
                            >
                                {tierInfo.icon}
                            </div>
                        </div>

                        {/* Info block */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-black text-white truncate">
                                {currentUser.displayName || currentUser.email.split('@')[0]}
                            </h1>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser.email}</p>

                            {/* Tier / role / verified pills */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                                <span
                                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                                    style={{
                                        background: tierInfo.bg,
                                        color: tierInfo.color,
                                        borderColor: `${tierInfo.color}40`,
                                    }}
                                >
                                    {tierInfo.icon} {tierInfo.label}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-400">
                                    {currentUser.activeRole.replace('_', ' ')}
                                </span>
                                {currentUser.isVerified && (
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                                        Verified
                                    </span>
                                )}
                            </div>

                            {/* Stats grid — 4 columns on all sizes, stacked number+label per cell */}
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                <div className="text-center">
                                    <p className="text-base font-black text-white leading-tight">
                                        {currentUser.points || 0}
                                    </p>
                                    <p className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">
                                        Points
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-base font-black text-white leading-tight">
                                        {earnedBadges.length}
                                    </p>
                                    <p className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">
                                        Badges
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-base font-black text-white leading-tight">
                                        {currentUser.stats?.sightingsReported || 0}
                                    </p>
                                    <p className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">
                                        Sightings
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[11px] font-black text-white leading-tight">
                                        {joinDate}
                                    </p>
                                    <p className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">
                                        Joined
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio preview */}
                    {currentUser.bio && (
                        <p className="mt-4 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                            {currentUser.bio}
                        </p>
                    )}
                </GlassCard>

                {/* ── Tab bar — 2×2 on mobile, 4-column on sm+ ── */}
                <div
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                    role="tablist"
                    aria-label="Profile sections"
                >
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`tabpanel-${tab.id}`}
                            id={`tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border min-h-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                                activeTab === tab.id
                                    ? 'bg-primary/10 text-white border-primary/40'
                                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <span className="text-base leading-none" aria-hidden="true">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* ── Tab content ── */}
                <motion.div
                    key={activeTab}
                    id={`tabpanel-${activeTab}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${activeTab}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.05, 0.7, 0.1, 1] }}
                >

                    {/* ━━━━━━━━━━━━━━━━━━ PROFILE TAB ━━━━━━━━━━━━━━━━━━ */}
                    {activeTab === 'profile' && (
                        <GlassCard className="p-4 sm:p-6 space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                                {t('profileSettings', 'Edit Profile')}
                            </h3>

                            {/* Display name */}
                            <div>
                                <label
                                    htmlFor="display-name"
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5"
                                >
                                    Display Name
                                </label>
                                <input
                                    id="display-name"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    className="input-base w-full"
                                    placeholder="Your display name..."
                                    maxLength={40}
                                    autoComplete="name"
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label
                                    htmlFor="bio"
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5"
                                >
                                    Bio
                                </label>
                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    className="input-base w-full resize-none"
                                    rows={3}
                                    placeholder="Tell the community about yourself..."
                                    maxLength={200}
                                />
                                <p className="text-[9px] text-slate-600 text-right mt-1">
                                    {bio.length}/200
                                </p>
                            </div>

                            {/* Photo upload — full width on mobile */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                    Profile Photo
                                </label>
                                <button
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={uploadingPhoto}
                                    aria-label="Upload a new profile photo"
                                    className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/20 hover:border-white/40 transition-all w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-60"
                                >
                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                                        {currentUser.photoURL ? (
                                            <img
                                                src={currentUser.photoURL}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-white/5 flex items-center justify-center text-lg" aria-hidden="true">
                                                👤
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                                            {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                                        </p>
                                        <p className="text-[9px] text-slate-500">JPG, PNG, WebP — max 5MB</p>
                                    </div>
                                    {uploadingPhoto && (
                                        <div className="ml-auto">
                                            <LoadingSpinner size="sm" />
                                        </div>
                                    )}
                                </button>
                            </div>

                            {/* Save — full width always */}
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-primary text-black hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                            >
                                {saving ? <LoadingSpinner size="sm" /> : <span aria-hidden="true">💾</span>}
                                {t('submitButton', 'Save Profile')}
                            </button>
                        </GlassCard>
                    )}

                    {/* ━━━━━━━━━━━━━━━━━━ BADGES TAB ━━━━━━━━━━━━━━━━━━ */}
                    {activeTab === 'badges' && (
                        <div className="space-y-5">
                            {/* Earned badges */}
                            <GlassCard className="p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                                        {t('activeBadges', 'Earned Badges')}
                                    </h3>
                                    <span className="text-[9px] font-black text-slate-400 uppercase">
                                        {earnedBadges.length} / {BADGES.length}
                                    </span>
                                </div>
                                {earnedBadges.length > 0 ? (
                                    /*
                                        Responsive grid:
                                        - 2 columns on mobile
                                        - 3 columns on sm (640px+)
                                        - 4 columns on md (768px+)
                                    */
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
                                        {earnedBadges.map(badge => (
                                            <BadgeCard key={badge} badgeName={badge} size="md" earned />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="text-4xl mb-2" aria-hidden="true">🎖️</div>
                                        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
                                            {t('noBadgesYet', 'No badges yet')}
                                        </p>
                                        <p className="text-slate-600 text-xs mt-1">
                                            Report sightings, complete patrols and missions to earn badges
                                        </p>
                                    </div>
                                )}
                            </GlassCard>

                            {/* All badges showcase */}
                            <GlassCard className="p-4 sm:p-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                                    All Badges
                                </h3>
                                {/*
                                    BadgeShowcase renders its own flex-wrap grid internally.
                                    The responsive grid is overridden here via a wrapper div.
                                */}
                                <div className="[&>div]:grid [&>div]:grid-cols-2 [&>div]:sm:grid-cols-3 [&>div]:md:grid-cols-4 [&>div]:gap-4 [&>div]:justify-items-center [&>div]:flex-none">
                                    <BadgeShowcase earnedBadges={earnedBadges} showAll />
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* ━━━━━━━━━━━━━━━━━━ SETTINGS TAB ━━━━━━━━━━━━━━━━━━ */}
                    {activeTab === 'settings' && (
                        <GlassCard className="p-4 sm:p-6 space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                                Preferences
                            </h3>

                            {/* Notifications toggle — stacks on mobile */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white">
                                        {t('notifications', 'Push Notifications')}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        Receive alerts for nearby lost pets and sightings
                                    </p>
                                </div>
                                <button
                                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                    role="switch"
                                    aria-checked={notificationsEnabled}
                                    aria-label="Toggle push notifications"
                                    className="relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                                    style={{ background: notificationsEnabled ? 'var(--color-primary, #00D2FF)' : 'rgba(255,255,255,0.1)' }}
                                >
                                    <span
                                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
                                        style={{ transform: notificationsEnabled ? 'translateX(20px)' : 'translateX(0)' }}
                                        aria-hidden="true"
                                    />
                                </button>
                            </div>

                            {/* Account info — label/value stack on narrow screens */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Account Info
                                </p>

                                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0 text-xs">
                                    <span className="text-slate-400">Email</span>
                                    <span className="text-white font-mono break-all">{currentUser.email}</span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0 text-xs">
                                    <span className="text-slate-400">Role</span>
                                    <span className="text-white capitalize">
                                        {currentUser.activeRole.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0 text-xs">
                                    <span className="text-slate-400">Member since</span>
                                    <span className="text-white">{joinDate}</span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0 text-xs">
                                    <span className="text-slate-400">User ID</span>
                                    <span className="text-white font-mono text-[9px] break-all">
                                        {currentUser.uid.slice(0, 12)}...
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-primary text-black hover:opacity-90 transition-all flex items-center justify-center gap-2 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                            >
                                <span aria-hidden="true">⚙️</span> Save Settings
                            </button>
                        </GlassCard>
                    )}

                    {/* ━━━━━━━━━━━━━━━━━━ SECURITY TAB ━━━━━━━━━━━━━━━━━━ */}
                    {activeTab === 'security' && (
                        <GlassCard className="p-4 sm:p-6 space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                                Change Password
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Only available for email/password accounts. Google and phone sign-in users cannot change their password here.
                            </p>

                            {/* Current password */}
                            <div>
                                <label
                                    htmlFor="current-password"
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5"
                                >
                                    Current Password
                                </label>
                                <input
                                    id="current-password"
                                    type={showPasswords ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="input-base w-full"
                                    placeholder="Enter current password..."
                                    autoComplete="current-password"
                                />
                            </div>

                            {/* New password */}
                            <div>
                                <label
                                    htmlFor="new-password"
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5"
                                >
                                    New Password
                                </label>
                                <input
                                    id="new-password"
                                    type={showPasswords ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="input-base w-full"
                                    placeholder="Enter new password..."
                                    autoComplete="new-password"
                                />
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label
                                    htmlFor="confirm-password"
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5"
                                >
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirm-password"
                                    type={showPasswords ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="input-base w-full"
                                    placeholder="Confirm new password..."
                                    autoComplete="new-password"
                                    aria-describedby={
                                        confirmPassword && newPassword !== confirmPassword
                                            ? 'password-mismatch-error'
                                            : undefined
                                    }
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p
                                        id="password-mismatch-error"
                                        role="alert"
                                        className="text-[10px] text-red-400 font-bold uppercase tracking-tight px-1 mt-1"
                                    >
                                        Passwords don't match
                                    </p>
                                )}
                            </div>

                            {/* Show/hide toggle */}
                            <div className="flex items-center gap-2">
                                <input
                                    id="show-passwords"
                                    type="checkbox"
                                    checked={showPasswords}
                                    onChange={e => setShowPasswords(e.target.checked)}
                                    className="w-4 h-4 accent-primary"
                                />
                                <label
                                    htmlFor="show-passwords"
                                    className="text-xs text-slate-400 cursor-pointer select-none"
                                >
                                    Show passwords
                                </label>
                            </div>

                            {/* Change password — full width always */}
                            <button
                                onClick={handleChangePassword}
                                disabled={
                                    changingPassword ||
                                    !currentPassword ||
                                    !newPassword ||
                                    newPassword !== confirmPassword
                                }
                                className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-primary text-black hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                            >
                                {changingPassword
                                    ? <LoadingSpinner size="sm" />
                                    : <span aria-hidden="true">🔒</span>
                                }
                                Change Password
                            </button>
                        </GlassCard>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
