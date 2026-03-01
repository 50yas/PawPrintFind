import React, { useState, Suspense } from 'react';
import { User, PetProfile, VetClinic } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { dbService } from '../../services/firebase';
import { GlassCard, GlassButton } from '../ui';
import { AdminVetVerificationHUD } from '../AdminVetVerificationHUD';
import { LoadingSpinner } from '../LoadingSpinner';

const AddClinicModal = React.lazy(() => import('../AddClinicModal').then(m => ({ default: m.AddClinicModal })));
const AddVetModal = React.lazy(() => import('../AddVetModal').then(m => ({ default: m.AddVetModal })));
const AdminPetEditorModal = React.lazy(() => import('../AdminPetEditorModal').then(m => ({ default: m.AdminPetEditorModal })));

type OpsSubTab = 'pets' | 'clinics' | 'verification';

interface OperationsTabProps {
    allPets: PetProfile[];
    vetClinics: VetClinic[];
    users: User[];
    currentUser: User;
    pendingVerificationCount: number;
    onViewPet: (pet: PetProfile) => void;
    onRefresh: () => Promise<void>;
}

export const OperationsTab: React.FC<OperationsTabProps> = ({
    allPets,
    vetClinics,
    users,
    currentUser,
    pendingVerificationCount,
    onViewPet,
    onRefresh,
}) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();

    const [subTab, setSubTab] = useState<OpsSubTab>(pendingVerificationCount > 0 ? 'verification' : 'pets');
    const [petSearch, setPetSearch] = useState('');
    const [petStatusFilter, setPetStatusFilter] = useState<'all' | 'lost' | 'forAdoption' | 'owned'>('all');
    const [editingPet, setEditingPet] = useState<PetProfile | null>(null);
    const [showEditPet, setShowEditPet] = useState(false);
    const [showAddClinic, setShowAddClinic] = useState(false);
    const [showAddVet, setShowAddVet] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const filteredPets = allPets.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(petSearch.toLowerCase()) ||
            p.breed.toLowerCase().includes(petSearch.toLowerCase()) ||
            p.id.toLowerCase().includes(petSearch.toLowerCase());
        const matchesStatus = petStatusFilter === 'all' || p.status === petStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleUpdatePet = async (pet: PetProfile) => {
        setIsRefreshing(true);
        try {
            await dbService.savePet(pet);
            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'UPDATE_PET',
                targetId: pet.id,
                details: `Admin override update for pet: ${pet.name}`,
            });
            addSnackbar(t('dashboard:admin.petUpdated'), 'success');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    const deleteClinic = async (id: string) => {
        if (!confirm(t('dashboard:admin.confirmDismantleClinic'))) return;
        setIsRefreshing(true);
        try {
            await dbService.deleteClinic(id);
            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'DELETE_CLINIC',
                targetId: id,
                details: `Deleted clinic ${id}`,
            });
            addSnackbar(t('dashboard:admin.clinicDismantled'), 'success');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    const subTabs: { id: OpsSubTab; label: string; icon: string; count?: number }[] = [
        { id: 'pets', label: t('dashboard:admin.adminTabPets'), icon: '🐾' },
        { id: 'clinics', label: t('dashboard:admin.adminTabClinics'), icon: '🏥' },
        {
            id: 'verification',
            label: t('dashboard:admin.pendingVerificationsTitle'),
            icon: '🛡️',
            count: pendingVerificationCount,
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <span className="text-3xl">🐾</span>
                    Operations
                </h2>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex gap-2 border-b border-white/10 pb-0">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id)}
                        className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 -mb-px ${
                            subTab === tab.id
                                ? 'border-primary text-white'
                                : 'border-transparent text-slate-500 hover:text-white hover:border-white/20'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px] animate-pulse">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Pets Sub-tab */}
            {subTab === 'pets' && (
                <div className="space-y-6">
                    <div className="flex flex-col xl:flex-row justify-between items-center px-2 gap-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('dashboard:admin.adminTabPets')}</h3>
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full xl:w-auto">
                            <select
                                value={petStatusFilter}
                                onChange={(e) => setPetStatusFilter(e.target.value as any)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-mono text-white focus:border-primary/50 outline-none uppercase tracking-wider flex-grow md:flex-grow-0"
                            >
                                <option value="all">{t('dashboard:admin.allStatus')}</option>
                                <option value="lost">{t('dashboard:admin.statusLost')}</option>
                                <option value="forAdoption">{t('dashboard:admin.statusAdoption')}</option>
                                <option value="owned">{t('dashboard:admin.statusOwned')}</option>
                            </select>
                            <div className="relative flex-grow md:w-64 min-w-[200px]">
                                <input
                                    value={petSearch}
                                    onChange={e => setPetSearch(e.target.value)}
                                    placeholder={t('dashboard:admin.searchPetPlaceholder')}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-[10px] font-mono text-white focus:border-primary/50 outline-none transition-all"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 text-sm">🔍</span>
                            </div>
                        </div>
                    </div>
                    <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-xs min-w-[800px]">
                                <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                    <tr className="border-b border-white/10">
                                        <th className="p-5">{t('dashboard:admin.petNameLabel')}</th>
                                        <th className="p-5">{t('dashboard:admin.status')}</th>
                                        <th className="p-5">{t('dashboard:admin.location')}</th>
                                        <th className="p-5 text-right">{t('dashboard:admin.tableActions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredPets.map(p => (
                                        <tr key={p.id} className="hud-table-row group">
                                            <td className="p-5">
                                                <div
                                                    className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                                    onPointerDown={() => onViewPet(p)}
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors shadow-xl text-primary/20">
                                                        {p.photos[0]?.url ? (
                                                            <img src={p.photos[0].url} alt={p.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xl font-black">?</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{p.name}</p>
                                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{p.breed} • {p.age}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm ${
                                                    p.isLost ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                                                    p.status === 'forAdoption' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                    'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                                }`}>
                                                    {p.isLost ? t('dashboard:admin.statusLost') :
                                                        p.status === 'forAdoption' ? t('dashboard:admin.statusAdoption') :
                                                        t('dashboard:admin.statusOwned')}
                                                </span>
                                            </td>
                                            <td className="p-5 font-mono text-slate-500 tracking-tighter">
                                                {p.lastSeenLocation ? `${p.lastSeenLocation.latitude.toFixed(4)}, ${p.lastSeenLocation.longitude.toFixed(4)}` : t('dashboard:admin.orbitalUnknown')}
                                            </td>
                                            <td className="p-5 text-right space-x-2">
                                                <button
                                                    onClick={() => { setEditingPet(p); setShowEditPet(true); }}
                                                    className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                >
                                                    {t('dashboard:admin.editButton')}
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(t('dashboard:admin.confirmTerminateProfile'))) {
                                                            await dbService.deletePet(p.id);
                                                            await dbService.logAdminAction({
                                                                adminEmail: currentUser.email,
                                                                action: 'DELETE_PET',
                                                                targetId: p.id,
                                                                details: `Terminated pet profile: ${p.name}`,
                                                            });
                                                            await onRefresh();
                                                        }
                                                    }}
                                                    className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                                                >
                                                    {t('dashboard:admin.terminateButton')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPets.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10">
                                                <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.3em] opacity-50">No pets found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Clinics Sub-tab */}
            {subTab === 'clinics' && (
                <div className="space-y-8">
                    <div className="flex flex-col xl:flex-row justify-between items-center px-2 gap-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('dashboard:admin.adminTabClinics')}</h3>
                        <div className="flex flex-wrap items-center justify-center gap-3 w-full xl:w-auto">
                            <GlassButton onClick={() => setShowAddVet(true)} variant="secondary" className="!py-2 !px-4 text-[10px] border-primary/20 flex-grow md:flex-grow-0">
                                + {t('dashboard:admin.newVetButton')}
                            </GlassButton>
                            <GlassButton onClick={() => setShowAddClinic(true)} variant="primary" className="!py-2 !px-4 text-[10px] flex-grow md:flex-grow-0">
                                + {t('dashboard:admin.newClinicButton')}
                            </GlassButton>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">{t('dashboard:admin.authorizedFacilities')}</p>
                        <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left text-xs min-w-[800px]">
                                    <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                        <tr className="border-b border-white/10">
                                            <th className="p-5">{t('dashboard:admin.clinicNameLabel')}</th>
                                            <th className="p-5">{t('dashboard:admin.contactTitle')}</th>
                                            <th className="p-5">{t('dashboard:admin.addressLabel')}</th>
                                            <th className="p-5 text-right">{t('dashboard:admin.tableActions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {vetClinics.map(c => (
                                            <tr key={c.id} className="hud-table-row group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-500 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors shadow-lg">🏥</div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{c.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-tighter">{t('dashboard:admin.verifiedStatus')}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <span className="text-[10px]">📧</span>
                                                            <span className="text-[10px] font-mono">{c.vetEmail}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <span className="text-[10px]">📞</span>
                                                            <span className="text-[10px] font-mono">{c.phone}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 font-mono text-slate-500 text-[10px]">{c.address}</td>
                                                <td className="p-5 text-right">
                                                    <button
                                                        onClick={() => deleteClinic(c.id!)}
                                                        className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                                                    >
                                                        {t('dashboard:admin.dismantleButton')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {vetClinics.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-10">
                                                    <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.3em] opacity-50">{t('dashboard:admin.noVetsFound')}</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Vets Pending Infrastructure */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">{t('dashboard:admin.pendingInfrastructure')}</p>
                        <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left text-xs min-w-[800px]">
                                    <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                        <tr className="border-b border-white/10">
                                            <th className="p-5">{t('dashboard:admin.tableRole')}</th>
                                            <th className="p-5">{t('dashboard:admin.status')}</th>
                                            <th className="p-5 text-right">{t('dashboard:admin.tableActions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.filter(u => (u.roles || []).includes('vet')).map(v => {
                                            const hasClinic = vetClinics.some(c => c.vetEmail === v.email);
                                            return (
                                                <tr key={v.uid} className="hud-table-row group">
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-primary border border-white/10 group-hover:border-primary/50 transition-colors shadow-lg">
                                                                {v.email.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white text-sm">{v.email}</p>
                                                                <p className="text-[9px] font-mono text-slate-500 tracking-tighter">{v.uid}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${v.isVerified ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'}`}>
                                                                {v.isVerified ? t('dashboard:admin.verifiedPro') : t('dashboard:admin.pendingVerification')}
                                                            </span>
                                                            {hasClinic ? (
                                                                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase font-bold">{t('dashboard:admin.linkedStatus')}</span>
                                                            ) : (
                                                                <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 uppercase font-bold">{t('dashboard:admin.unlinkedStatus')}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-right space-x-2">
                                                        {!hasClinic && (
                                                            <button
                                                                onClick={() => setShowAddClinic(true)}
                                                                className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                            >
                                                                {t('dashboard:admin.createClinicAction')}
                                                            </button>
                                                        )}
                                                        {!v.isVerified && v.verificationData && (
                                                            <button
                                                                onClick={() => setSubTab('verification')}
                                                                className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                            >
                                                                {t('dashboard:admin.verifyNowAction')}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}

            {/* Verification Sub-tab */}
            {subTab === 'verification' && (
                <div>
                    {pendingVerificationCount > 0 && (
                        <div className="mb-4 flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30">
                            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                {pendingVerificationCount} pending verification{pendingVerificationCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                    <AdminVetVerificationHUD />
                </div>
            )}

            {/* Modals */}
            <Suspense fallback={<div className="flex items-center justify-center h-24"><LoadingSpinner /></div>}>
                {showAddClinic && (
                    <AddClinicModal
                        onClose={() => setShowAddClinic(false)}
                        onSuccess={onRefresh}
                        adminEmail={currentUser.email}
                    />
                )}
                {showAddVet && (
                    <AddVetModal
                        onClose={() => setShowAddVet(false)}
                        onSuccess={onRefresh}
                        adminEmail={currentUser.email}
                    />
                )}
                {showEditPet && editingPet && (
                    <AdminPetEditorModal
                        pet={editingPet}
                        currentUser={currentUser}
                        isOpen={showEditPet}
                        onClose={() => setShowEditPet(false)}
                        onUpdate={handleUpdatePet}
                    />
                )}
            </Suspense>
        </div>
    );
};
