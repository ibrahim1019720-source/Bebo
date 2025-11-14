import React from 'react';
import { ExerciseCategory } from '../types';

interface PracticeZoneProps {
  exercises: ExerciseCategory[];
  onListen: (sentence: string) => void;
  onPractice: (sentence: string) => void;
  audioLoadingSentence: string | null;
  recordingSentence: string | null;
  isRecording: boolean;
  isProcessing: boolean;
  selectedLanguage: string;
}

const DifficultyBadge: React.FC<{ difficulty: ExerciseCategory['difficulty'] }> = ({ difficulty }) => {
  const colors = {
    Beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return (
    <span className={`ml-3 px-2.5 py-0.5 text-xs font-medium rounded-full ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
};

// New helper component for rendering stressed words
const StressedSentence: React.FC<{ sentence: string }> = ({ sentence }) => {
  // Split by the markdown pattern (**word**), keeping the delimiters
  const parts = sentence.split(/(\*\*.*?\*\*)/g).filter(part => part);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="text-indigo-600 dark:text-indigo-400 font-bold">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};


export const PracticeZone: React.FC<PracticeZoneProps> = ({
  exercises,
  onListen,
  onPractice,
  audioLoadingSentence,
  recordingSentence,
  isRecording,
  isProcessing,
  selectedLanguage,
}) => {
  if (selectedLanguage === 'auto') {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p className="text-gray-600 dark:text-gray-300">Please select a specific language to see practice exercises.</p>
      </div>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
       <div className="text-center p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p className="text-gray-600 dark:text-gray-300">No practice exercises available for this language yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in pt-6">
      {exercises.map((category, catIndex) => (
        <div key={catIndex} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{category.title}</h3>
            <DifficultyBadge difficulty={category.difficulty} />
          </div>
          <ul className="space-y-4">
            {category.exercises.map((exercise, exIndex) => (
              <li key={exIndex} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 dark:text-gray-200 flex-grow pr-4">
                    <StressedSentence sentence={exercise.sentence} />
                  </p>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => onListen(exercise.sentence)}
                      disabled={audioLoadingSentence !== null || isRecording || isProcessing}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Listen to exercise"
                    >
                      {audioLoadingSentence === exercise.sentence ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-volume-up"></i>}
                    </button>
                    <button
                      onClick={() => onPractice(exercise.sentence)}
                      disabled={(isRecording && recordingSentence !== exercise.sentence) || audioLoadingSentence !== null || isProcessing}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${recordingSentence === exercise.sentence && isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                      aria-label="Practice exercise"
                    >
                      <i className={`fas ${recordingSentence === exercise.sentence && isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};