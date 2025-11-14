import { UserProfile, PracticeSession } from '../types';

const PROFILES_KEY = 'voniUserProfiles';
const CURRENT_PROFILE_ID_KEY = 'voniCurrentUserProfileId';
const LEGACY_HISTORY_KEY = 'voniPracticeHistory';

// --- Migration ---
export const migrateLegacyHistory = (): void => {
  try {
    const legacyHistoryRaw = localStorage.getItem(LEGACY_HISTORY_KEY);
    const profilesRaw = localStorage.getItem(PROFILES_KEY);

    if (legacyHistoryRaw && !profilesRaw) {
      const legacyHistory: PracticeSession[] = JSON.parse(legacyHistoryRaw);
      if (legacyHistory.length > 0) {
        const guestProfile: UserProfile = {
          id: `user-${Date.now()}`,
          name: 'Guest',
          avatar: 'G',
          createdAt: new Date().toISOString(),
          practiceHistory: legacyHistory,
          lastSelectedLanguageId: 'auto',
          lastExplanationLanguageId: 'English',
        };
        saveProfiles([guestProfile]);
        setCurrentUserProfileId(guestProfile.id);
        localStorage.removeItem(LEGACY_HISTORY_KEY);
        console.log('Successfully migrated legacy history to a new Guest profile.');
      }
    }
  } catch (error) {
    console.error('Error during legacy data migration:', error);
  }
};


// --- Profile Management ---
export const getProfiles = (): UserProfile[] => {
  try {
    const profilesJson = localStorage.getItem(PROFILES_KEY);
    return profilesJson ? JSON.parse(profilesJson) : [];
  } catch (e) {
    console.error('Failed to get profiles from localStorage', e);
    return [];
  }
};

export const saveProfiles = (profiles: UserProfile[]): void => {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save profiles to localStorage', e);
  }
};

export const addProfile = (name: string): UserProfile | null => {
  if (!name.trim()) return null;
  const profiles = getProfiles();
  const newProfile: UserProfile = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    avatar: name.trim().charAt(0).toUpperCase(),
    createdAt: new Date().toISOString(),
    practiceHistory: [],
    lastSelectedLanguageId: 'auto',
    lastExplanationLanguageId: 'English',
  };
  const updatedProfiles = [...profiles, newProfile];
  saveProfiles(updatedProfiles);
  return newProfile;
};

export const updateProfile = (updatedProfile: UserProfile): void => {
  const profiles = getProfiles();
  const updatedProfiles = profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p);
  saveProfiles(updatedProfiles);
};

// --- Current Profile ---
export const getCurrentUserProfileId = (): string | null => {
  return localStorage.getItem(CURRENT_PROFILE_ID_KEY);
};

export const setCurrentUserProfileId = (id: string): void => {
  localStorage.setItem(CURRENT_PROFILE_ID_KEY, id);
};

export const clearCurrentUserProfileId = (): void => {
  localStorage.removeItem(CURRENT_PROFILE_ID_KEY);
};
