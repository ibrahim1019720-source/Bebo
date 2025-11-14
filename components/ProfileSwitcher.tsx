import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileSwitcherProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  onSwitchProfile: (profileId: string) => void;
  onAddProfile: () => void;
  onSignOut: () => void;
  isManager: boolean;
}

export const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ currentUser, profiles, onSwitchProfile, onAddProfile, onSignOut, isManager }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
          {currentUser.avatar}
        </div>
        <span className="font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">{currentUser.name}</span>
        <i className={`fas fa-chevron-down text-xs text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700">
          {profiles.filter(p => p.id !== currentUser.id).map(profile => (
            <a
              key={profile.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSwitchProfile(profile.id);
                setIsOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
             <div className="w-6 h-6 mr-3 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {profile.avatar}
              </div>
              {profile.name}
            </a>
          ))}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          {isManager && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onAddProfile();
                setIsOpen(false);
              }}
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <i className="fas fa-plus w-6 mr-3 text-center"></i>
              Add Profile
            </a>
          )}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSignOut();
              setIsOpen(false);
            }}
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className="fas fa-sign-out-alt w-6 mr-3 text-center"></i>
            Switch User
          </a>
        </div>
      )}
    </div>
  );
};