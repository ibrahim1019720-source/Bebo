
import React, { useState } from 'react';

interface PasswordProtectionProps {
  onAuthenticate: (isManager: boolean) => void;
}

const MANAGER_CODE = 'VONIBEBO2025';

// Generate a list of valid codes
const codes: string[] = ['VONI2024'];
for (let i = 1; i <= 200; i++) {
    // Pad with leading zeros to make it 3 digits, e.g., VONI001, VONI012, VONI123
    codes.push(`VONI${String(i).padStart(3, '0')}`);
}
// Use a Set for efficient O(1) lookups
const VALID_CODES = new Set(codes);

export const PasswordProtection: React.FC<PasswordProtectionProps> = ({ onAuthenticate }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MANAGER_CODE) {
      onAuthenticate(true);
    } else if (VALID_CODES.has(password)) {
      onAuthenticate(false);
    } else {
      setError('Incorrect code. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">VoNi</h1>
            <p className="mt-2 text-md text-gray-500 dark:text-gray-400">Say it Better.</p>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-white mb-4">Enter Access Code</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Access Code"
            className="w-full p-3 text-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            autoFocus
          />
          {error && <p className="text-red-500 dark:text-red-400 text-sm text-center mt-3">{error}</p>}
          <button
            type="submit"
            className="w-full mt-6 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
};
