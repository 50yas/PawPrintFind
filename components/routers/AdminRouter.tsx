
import React, { lazy, Suspense } from 'react';
import { User, PetProfile, VetClinic, Donation, BlogPost } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';

const AdminDashboard = lazy(() => import('../AdminDashboard').then(m => ({ default: m.AdminDashboard })));

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
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><LoadingSpinner /></div>}>
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
        </Suspense>
    );
};
