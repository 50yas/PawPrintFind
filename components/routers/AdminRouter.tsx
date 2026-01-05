
import React from 'react';
import { AdminDashboard } from '../AdminDashboard';
import { User, PetProfile, VetClinic, Donation, BlogPost } from '../../types';

interface AdminRouterProps {
    users: User[];
    currentUser: User;
    allPets: PetProfile[];
    vetClinics: VetClinic[];
    donations: Donation[];
    onDeleteUser: (uid: string) => Promise<void>;
    onLogout: () => void;
    onRefresh: () => Promise<void>;
    onViewPost?: (post: BlogPost) => void;
}

export const AdminRouter: React.FC<AdminRouterProps> = (props) => {
    return (
        <AdminDashboard
            users={props.users}
            currentUser={props.currentUser}
            allPets={props.allPets}
            vetClinics={props.vetClinics}
            donations={props.donations}
            onDeleteUser={props.onDeleteUser}
            onLogout={props.onLogout}
            onRefresh={props.onRefresh}
            onViewPost={props.onViewPost}
        />
    );
};
