
import React from 'react';
import { VetDashboard } from '../VetDashboard';
import { MyClinic } from '../MyClinic';
import { MyPatients } from '../MyPatients';
import { PatientDetail } from '../PatientDetail';
import { SmartCalendar } from '../SmartCalendar';
import { View, User, PetProfile, VetClinic, Appointment, Donation, BlogPost } from '../../types';
import { dbService } from '../../services/firebase';
import { Home } from '../Home';
import { AdoptionCenter } from '../AdoptionCenter';
import { PressKit } from '../PressKit';
import { Donors } from '../Donors';
import { Blog } from '../Blog';
import { BlogPostDetail } from '../BlogPostDetail';

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
    selectedPost: BlogPost | null;
    setSelectedPost: (p: BlogPost | null) => void;
    handleStartChat: (p: PetProfile) => Promise<void>;
    setIsLoginModalOpen: (open: boolean) => void;
    isLoading?: boolean;
}

export const VetRouter: React.FC<VetRouterProps> = ({
    currentView, setView, currentUser, allPets, lostPets, petsForAdoption, vetClinics, donations, appointments, viewingPatient, setViewingPatient, selectedPost, setSelectedPost, handleStartChat, setIsLoginModalOpen, isLoading
}) => {
    const vetApps = appointments.filter(a => a.vetEmail === currentUser.email);
    const vetPatients = allPets.filter(p => p.vetEmail === currentUser.email && p.vetLinkStatus === 'linked');
    const pendingRequests = allPets.filter(p => p.vetEmail === currentUser.email && p.vetLinkStatus === 'pending');

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
            return <AdoptionCenter petsForAdoption={petsForAdoption} onInquire={handleStartChat} goBack={() => setView('home')} currentUser={currentUser} isLoading={isLoading} />;
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
            return <Home setView={setView} openLogin={() => setIsLoginModalOpen(true)} currentUser={currentUser} lostPets={lostPets} petsForAdoption={petsForAdoption} />;
    }
};
