import React from 'react';
import { User, UserRole } from '../types';
import { dbService } from '../services/firebase';

interface RoleSwitcherProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentUser, setCurrentUser }) => {
  if (!currentUser.roles || currentUser.roles.length <= 1) {
    return null;
  }

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole !== currentUser.activeRole) {
      const updatedUser = { ...currentUser, activeRole: newRole };
      await dbService.updateUser(updatedUser);
      setCurrentUser(updatedUser);
    }
  };

  return (
    <div className="relative">
      <select
        value={currentUser.activeRole}
        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
        className="bg-gray-800 text-white p-2 rounded"
      >
        {currentUser.roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </div>
  );
};
