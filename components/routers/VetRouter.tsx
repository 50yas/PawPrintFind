
import React, { lazy, Suspense } from 'react';
import { View, User, PetProfile, VetClinic, Appointment, Donation, BlogPost } from '../../types';
import { dbService } from '../../services/firebase';
import { LoadingSpinner } from '../LoadingSpinner';
import { DashboardSkeleton, GridSkeleton } from '../ui/LoadingSkeletons';

const VetDashboard = lazy(() => import('../VetDashboard').then(m => ({ default: m.VetDashboard })));
const MyClinic = lazy(() => import('../MyClinic').then(m => ({ default: m.MyClinic })));
const MyPatients = lazy(() => import('../MyPatients').then(m => ({ default: m.MyPatients })));
const PatientDetail = lazy(() => import('../PatientDetail').then(m => ({ default: m.PatientDetail })));
const SmartCalendar = lazy(() => import('../SmartCalendar').then(m => ({ default: m.SmartCalendar })));
const Home = lazy(() => import('../Home').then(m => ({ default: m.Home })));
const AdoptionCenter = lazy(() => import('../AdoptionCenter').then(m => ({ default: m.AdoptionCenter })));
const LostPetsCenter = lazy(() => import('../LostPetsCenter').then(m => ({ default: m.LostPetsCenter })));
const PressKit = lazy(() => import('../PressKit').then(m => ({ default: m.PressKit })));
const Donors = lazy(() => import('../Donors').then(m => ({ default: m.Donors })));
const Blog = lazy(() => import('../Blog').then(m => ({ default: m.Blog })));
const BlogPostDetail = lazy(() => import('../BlogPostDetail').then(m => ({ default: m.BlogPostDetail })));
const PublicPetDetail = lazy(() => import('../PublicPetDetail').then(m => ({ default: m.PublicPetDetail })));

const RouterSkeleton: React.FC<{ view: View }> = ({ view }) => {
    if (view === 'vetDashboard') return <DashboardSkeleton />;
    if (view === 'adoptionCenter') return <div className="max-w-7xl mx-auto p-6"><GridSkeleton variant="card" count={6} /></div>;
    return <div className="flex items-center justify-center min-h-[50vh]"><LoadingSpinner /></div>;
};

interface VetRouterProps {
    currentView: View;
    setView: (view: View) => void;
    currentUser: User;
    allPets: PetProfile[];
    lostPets: PetProfile[];
    petsForAdoption: PetProfile[];
    vetClinics: VetClinic[];
    donations: Donation[];
    appointments: Appointment[];
    viewingPatient: PetProfile | null;
    setViewingPatient: (p: PetProfile | null) => void;
    selectedPet: PetProfile | null;
    setSelectedPet: (pet: PetProfile | null) => void;
    onViewPet: (pet: PetProfile) => void;
    onReportSighting?: (pet: PetProfile) => void;
    selectedPost: BlogPost | null;
    setSelectedPost: (p: BlogPost | null) => void;
    handleStartChat: (p: PetProfile) => Promise<void>;
    setIsLoginModalOpen: (open: boolean) => void;
    isLoading: boolean;
}

export const VetRouter: React.FC<VetRouterProps> = ({
    currentView, setView, currentUser, allPets, lostPets, petsForAdoption, vetClinics, donations, appointments, viewingPatient, setViewingPatient, selectedPet, setSelectedPet, onViewPet, onReportSighting, selectedPost, setSelectedPost, handleStartChat, setIsLoginModalOpen, isLoading
}) => {
    const vetApps = React.useMemo(() => appointments.filter(a => a.vetEmail === currentUser.email), [appointments, currentUser.email]);
    const vetPatients = React.useMemo(() => allPets.filter(p => p.vetEmail === currentUser.email && p.vetLinkStatus === 'linked'), [allPets, currentUser.email]);
    const pendingRequests = React.useMemo(() => allPets.filter(p => p.vetEmail === currentUser.email && p.vetLinkStatus === 'pending'), [allPets, currentUser.email]);

    return (
        <Suspense fallback={<RouterSkeleton view={currentView} />}>
            {(() => {
                switch (currentView) {
                    case 'myClinic':
                        return (
                            <MyClinic
                                onSave={(c) => dbService.saveClinic(c)}
                                vetEmail={currentUser.email}
                                existingClinic={vetClinics.find(cl => cl.vetEmail === currentUser.email) || null}
                            />
                        );
                    case 'myPatients':
                        return (
                            <MyPatients
                                vetPatients={vetPatients}
                                pendingRequests={pendingRequests}
                                vetEmail={currentUser.email}
                                currentUser={currentUser}
                                onAccept={(id) => dbService.savePet({ ...allPets.find(x => x.id === id)!, vetLinkStatus: 'linked' })}
                                onDecline={(id) => dbService.savePet({ ...allPets.find(x => x.id === id)!, vetLinkStatus: 'unlinked', vetEmail: undefined })}
                                onViewPatient={setViewingPatient}
                                onAddPatient={() => { }}
                            />
                        );
                    case 'patientDetail':
                        return viewingPatient ? <PatientDetail patient={viewingPatient} goBack={() => setView('myPatients')} /> : null;
                    case 'smartCalendar':
                        return (
                            <SmartCalendar
                                vetPatients={vetPatients}
                                appointments={vetApps}
                                onAddAppointment={(a) => dbService.saveAppointment({ ...a, id: Date.now().toString(), status: 'pending', requestedBy: 'vet' })}
                                onStatusChange={(id, s) => dbService.saveAppointment({ ...vetApps.find(a => a.id === id)!, status: s })}
                            />
                        );
                    case 'adoptionCenter':
                        return <AdoptionCenter petsForAdoption={petsForAdoption} onInquire={handleStartChat} onViewPet={onViewPet} goBack={() => setView('home')} currentUser={currentUser} isLoading={isLoading} />;
                    case 'lostPetsCenter':
                        return <LostPetsCenter lostPets={lostPets} onContactOwner={handleStartChat} onViewPet={onViewPet} onOpenScanner={() => setView('find')} goBack={() => setView('home')} currentUser={currentUser} isLoading={isLoading} />;
                    case 'publicPetDetail':
                        return selectedPet ? <PublicPetDetail pet={selectedPet} goBack={() => setView(selectedPet.status === 'forAdoption' ? 'adoptionCenter' : 'lostPetsCenter')} onContactOwner={handleStartChat} onReportSighting={onReportSighting} currentUser={currentUser} /> : null;
                    case 'pressKit':
                        return <PressKit goBack={() => setView('home')} />;
                    case 'donors':
                        return <Donors goBack={() => setView('home')} donations={donations} />;
                    case 'blog':
                        return <Blog setView={setView} onSelectPost={(p) => { setSelectedPost(p); setView('blogPost'); }} />;
                    case 'blogPost':
                        return selectedPost ? <BlogPostDetail post={selectedPost} onBack={() => setView('blog')} /> : null;
                    case 'vetDashboard':
                        return (
                            <VetDashboard
                                user={currentUser}
                                setView={setView}
                                pendingPatientCount={pendingRequests.length}
                                pendingAppointmentCount={vetApps.filter(a => a.status === 'pending').length}
                                confirmedPatientCount={vetPatients.length}
                                todaysAppointments={vetApps.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'confirmed')}
                            />
                        );
                    default:
                        return <Home setView={setView} openLogin={() => setIsLoginModalOpen(true)} currentUser={currentUser} lostPets={lostPets} petsForAdoption={petsForAdoption} onContactOwner={handleStartChat} onViewPet={onViewPet} />;
                }
            })()}
        </Suspense>
    );
};
