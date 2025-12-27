
import React from 'react';
import { VetDashboard } from '../VetDashboard';
import { MyClinic } from '../MyClinic';
import { MyPatients } from '../MyPatients';
import { PatientDetail } from '../PatientDetail';
import { SmartCalendar } from '../SmartCalendar';
import { View, User, PetProfile, VetClinic, Appointment } from '../../types';
import { dbService } from '../../services/firebase';

interface VetRouterProps {
    currentView: View;
    setView: (view: View) => void;
    currentUser: User;
    allPets: PetProfile[];
    vetClinics: VetClinic[];
    appointments: Appointment[];
    viewingPatient: PetProfile | null;
    setViewingPatient: (p: PetProfile | null) => void;
}

export const VetRouter: React.FC<VetRouterProps> = ({
    currentView, setView, currentUser, allPets, vetClinics, appointments, viewingPatient, setViewingPatient
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
        default:
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
    }
};
