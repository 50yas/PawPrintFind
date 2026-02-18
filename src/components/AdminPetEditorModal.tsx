
import React from 'react';
import { PetProfile, User } from '../types';
import { Modal } from './Modal';
import { RegisterPet } from './RegisterPet';

interface AdminPetEditorModalProps {
    pet: PetProfile;
    currentUser: User;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (pet: PetProfile) => Promise<void>;
}

export const AdminPetEditorModal: React.FC<AdminPetEditorModalProps> = ({ pet, currentUser, isOpen, onClose, onUpdate }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Override Pet Protocol: ${pet.name}`}>
            <div className="max-h-[80vh] overflow-y-auto custom-scrollbar p-1">
                <RegisterPet 
                    mode={pet.status}
                    currentUser={currentUser}
                    existingPet={pet}
                    onRegister={async (updatedPet) => {
                        await onUpdate(updatedPet);
                        onClose();
                    }}
                    goToDashboard={onClose}
                />
            </div>
        </Modal>
    );
};
