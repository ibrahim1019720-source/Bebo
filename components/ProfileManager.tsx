import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileManagerProps {
  profiles: UserProfile[];
  onProfileSelect: (profile: UserProfile) => void;
  onCreateProfile: (name: string) => void;
  isManager: boolean;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onProfileSelect, onCreateProfile, isManager }) => {
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      onCreateProfile(newProfileName.trim());
      setNewProfileName('');
      setIsCreating(false);
    }
  };

  const renderProfileSelection = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Who's Practicing?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {profiles.map(profile => (
          <div key={profile.id} onClick={() => onProfileSelect(profile)} className="flex flex-col items-center p-4 rounded-lg cursor-pointer transition-transform transform hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-700">
            <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-white text-4xl font-bold mb-2">
              {profile.avatar}
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{profile.name}</span>
          </div>
        ))}
      </div>
      {isManager && (
        <button
          onClick={() => setIsCreating(true)}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition"
        >
          <i className="fas fa-plus mr-2"></i>Add Profile
        </button>
      )}
    </div>
  );

  const renderCreateProfile = () => (
    <form onSubmit={handleCreate} className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{profiles.length > 0 ? "Create New Profile" : "Create Your Profile"}</h2>
      <input
        type="text"
        value={newProfileName}
        onChange={(e) => setNewProfileName(e.target.value)}
        placeholder="Enter your name"
        className="w-full max-w-sm mx-auto p-3 text-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition mb-4"
        autoFocus
      />
      <div className="flex justify-center gap-4">
        {profiles.length > 0 && (
            <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-gray-600 transition"
            >
                Cancel
            </button>
        )}
        <button
          type="submit"
          disabled={!newProfileName.trim()}
          className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50 animate-fade-in">
        <div className="w-full max-w-lg mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            {isCreating || profiles.length === 0 ? renderCreateProfile() : renderProfileSelection()}
        </div>
    </div>
  );
};