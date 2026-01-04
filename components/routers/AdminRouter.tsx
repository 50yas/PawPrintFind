
import React from 'react';
import { AdminDashboard } from '../AdminDashboard';
import { User, PetProfile, VetClinic, Donation } from '../../types';

interface AdminRouterProps {
    users: User[];
    currentUser: User;
    allPets: PetProfile[];
    vetClinics: VetClinic[];
    donations: Donation[];
    onDeleteUser: (uid: string) => Promise<void>;
    onLogout: () => void;
    onRefresh: () => Promise<void>;
}

export const AdminRouter: React.FC<AdminRouterProps> = (props) => {
    return (
        <AdminDashboard
            users={props.users}
            currentUser={props.currentUser}
            allPets={props.allPets}
            vetClinics={props.vetClinics}
            donations={props.donations}
            onVerifyVet={() => { }} // Implementation hook
            onDeleteUser={props.onDeleteUser}
            onLogout={props.onLogout}
            onRefresh={props.onRefresh}
        />
    );
};
