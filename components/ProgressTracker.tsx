


import React, { useMemo } from 'react';
import { PracticeSession } from '../types';
import { ScoreChart } from './ScoreChart';

interface ProgressTrackerProps {
  history: PracticeSession[];
  isManager: boolean;
  onClearHistory: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ history, isManager, onClearHistory }) => {
    // Memoize calculations to avoid re-computing on every render
    const stats = useMemo(() => {
        if (history.length === 0) {
            return {
                averageScore: 0,
                averageFluencyScore: 0,
                persistentChallenges: [],
                sessionsByLanguage: {},
            };
        }

        const totalScore = history.reduce((sum, session) => sum + session.score, 0);
        const averageScore = Math.round(totalScore / history.length);
        
        const totalFluencyScore = history.reduce((sum, session) => sum + (session.fluencyScore || 0), 0);
        const averageFluencyScore = Math.round(totalFluencyScore / history.length);


        const wordCounts: Record<string, number> = {};
        history.forEach(session => {
            session.incorrectWords.forEach(wordFeedback => {
                const word = wordFeedback.word.toLowerCase();
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            });
        });

        const persistentChallenges = Object.entries(wordCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5) // Top 5
            .map(([word, count]) => ({ word, count }));

        const sessionsByLanguage = history.reduce((acc, session) => {
            acc[session.language] = (acc[session.language] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);


        return { averageScore, averageFluencyScore, persistentChallenges, sessionsByLanguage };
    }, [history]);

    if (history.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg mt-6 animate-fade-in">
                <i className="fas fa-history text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">No Progress Yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Complete a session in the 'Accent Coach' tab to start tracking your progress.</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8 animate-fade-in pt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Average Score */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Accuracy</p>
                    <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{stats.averageScore}%</p>
                </div>
                {/* Average Fluency */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Fluency</p>
                    <p className="text-4xl font-bold text-teal-500 dark:text-teal-400 mt-2">{stats.averageFluencyScore}%</p>
                </div>
                {/* Sessions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sessions Completed</p>
                    <p className="text-4xl font-bold text-gray-700 dark:text-gray-200 mt-2">{history.length}</p>
                </div>
                {/* Languages */}
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">Languages Practiced</p>
                    <div className="flex flex-wrap justify-center items-center gap-2">
                        {Object.entries(stats.sessionsByLanguage).map(([lang, count]) => (
                             <span key={lang} className="text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-full">
                                {lang} ({count})
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Score Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Your Score Trend</h3>
                <ScoreChart data={history.map(s => ({ date: s.date, score: s.score, fluencyScore: s.fluencyScore || 0 })).reverse()} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Persistent Challenges */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Persistent Challenges</h3>
                    {stats.persistentChallenges.length > 0 ? (
                        <ul className="space-y-3">
                            {stats.persistentChallenges.map(({ word, count }) => (
                                <li key={word} className="flex justify-between items-center text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <span className="font-medium text-gray-700 dark:text-gray-200 capitalize">{word}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Mispronounced {count} time(s)</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No recurring mistakes found yet. Great job!</p>
                    )}
                </div>

                {/* Recent Sessions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                     <h3 className="text-xl font-bold p-6 text-gray-800 dark:text-white">Recent Sessions</h3>
                     <div className="max-h-80 overflow-y-auto">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                            {history.slice(0, 10).map(session => (
                                <li key={session.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{session.language}</p>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{session.score}% <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Acc.</span></p>
                                            <p className="font-bold text-lg text-teal-500 dark:text-teal-400">{session.fluencyScore}% <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Flu.</span></p>
                                        </div>
                                    </div>
                                     <p className="text-sm text-gray-600 dark:text-gray-300 italic truncate">"{session.referenceText}"</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{new Date(session.date).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
             {isManager && (
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <button
                        onClick={onClearHistory}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <i className="fas fa-trash-alt mr-2"></i>
                        Clear History for Current User
                    </button>
                </div>
            )}
        </div>
    );
};