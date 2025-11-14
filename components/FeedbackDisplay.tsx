import React from 'react';
import { AnalysisResult, WordFeedback, PracticeExercise } from '../types';
import { WaveformVisualizer } from './WaveformVisualizer';

interface FeedbackDisplayProps {
  result: AnalysisResult | null;
  onPhoneticClick: (word: string, phonetic: string, key: string) => void;
  explainingKey: string | null;
  onListenToExercise: (sentence: string) => void;
  onPracticeExercise: (sentence: string) => void;
  audioLoadingSentence: string | null;
  recordingSentence: string | null;
  isRecording: boolean;
  isProcessing: boolean;
}

const getExerciseIcon = (type: PracticeExercise['type']) => {
  switch (type) {
    case 'Minimal Pair':
      return <i className="fas fa-exchange-alt mr-3 text-purple-400"></i>;
    case 'Tongue Twister':
      return <i className="fas fa-wind mr-3 text-blue-400"></i>;
    case 'Repetition Phrase':
      return <i className="fas fa-redo-alt mr-3 text-green-400"></i>;
    case 'Fill in the Blanks':
      return <i className="fas fa-puzzle-piece mr-3 text-orange-400"></i>;
    case 'Sentence Stress Practice':
      return <i className="fas fa-bullhorn mr-3 text-teal-400"></i>;
    default:
      return null;
  }
};

const HighlightedPhonetics: React.FC<{ fullText?: string, highlightText?: string }> = ({ fullText, highlightText }) => {
    if (!fullText) return null;
    if (!highlightText || !fullText.includes(highlightText)) {
        return <span>{fullText}</span>;
    }
    const parts = fullText.split(new RegExp(`(${highlightText})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlightText.toLowerCase() ? (
                    <span key={i} className="bg-red-200 dark:bg-red-800/50 rounded px-1 font-bold text-red-700 dark:text-red-300">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

// Helper for rendering sentences with stressed words
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


export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ 
  result, 
  onPhoneticClick, 
  explainingKey,
  onListenToExercise,
  onPracticeExercise,
  audioLoadingSentence,
  recordingSentence,
  isRecording,
  isProcessing
}) => {
  if (!result) {
    return null;
  }

  const getScoreColor = (score: number) => score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const scoreColor = getScoreColor(result.overallScore);
  const fluencyScoreColor = getScoreColor(result.fluencyScore);


  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-8 animate-fade-in">
      {/* Overall Score & Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Your Results</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-8">
            <div>
              <p className="text-lg text-gray-600 dark:text-gray-300">Accent Accuracy</p>
              <p className={`text-5xl font-bold ${scoreColor}`}>{result.overallScore}%</p>
            </div>
            <div>
              <p className="text-lg text-gray-600 dark:text-gray-300">Fluency</p>
              <p className={`text-5xl font-bold ${fluencyScoreColor}`}>{result.fluencyScore}%</p>
            </div>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-200 italic max-w-md text-right flex-grow">"{result.feedbackSummary}"</p>
        </div>
      </div>

      {/* Detailed Correction Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <h3 className="text-xl font-bold p-6 text-gray-800 dark:text-white">Detailed Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wider">Word</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wider">Pronunciation & Tips</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wider">Waveform Comparison</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {result.detailedFeedback.map((item, index) => {
                const userKey = `${index}-user`;
                const nativeKey = `${index}-native`;
                const isThisUserLoading = explainingKey === userKey;
                const isThisNativeLoading = explainingKey === nativeKey;
                
                return (
                  <tr key={index} className={item.isCorrect ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                    <td className={`p-4 font-medium ${item.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-100'}`}>{item.word}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                        <div className="flex flex-col space-y-2">
                           <div>
                                <span className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Yours:</span>
                                <button
                                    onClick={() => onPhoneticClick(item.word, item.userPronunciation, userKey)}
                                    disabled={!!explainingKey}
                                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait"
                                    aria-label={`Hear explanation for your pronunciation of ${item.word}`}
                                >
                                    {isThisUserLoading ? 
                                    <i className="fas fa-spinner fa-spin"></i> : 
                                    <i className="fas fa-volume-up text-gray-500 dark:text-gray-400"></i>
                                    }
                                    <HighlightedPhonetics fullText={item.userPronunciation} highlightText={item.problemPhonemeUser} />
                                </button>
                           </div>
                           <div>
                                <span className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Native:</span>
                                <button
                                    onClick={() => onPhoneticClick(item.word, item.nativePronunciation, nativeKey)}
                                    disabled={!!explainingKey}
                                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait"
                                    aria-label={`Hear explanation for native pronunciation of ${item.word}`}
                                >
                                    {isThisNativeLoading ? 
                                    <i className="fas fa-spinner fa-spin"></i> : 
                                    <i className="fas fa-volume-up text-gray-500 dark:text-gray-400"></i>
                                    }
                                    <span className="font-semibold text-gray-800 dark:text-white">
                                        <HighlightedPhonetics fullText={item.nativePronunciation} highlightText={item.problemPhonemeNative} />
                                    </span>
                                </button>
                           </div>
                        </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
                        {item.rhythmFeedback && (
                            <div className="flex items-start">
                                <i className="fas fa-wave-square w-5 text-center mr-2 text-blue-400 mt-1"></i>
                                <p><strong className="font-semibold text-gray-700 dark:text-gray-200">Rhythm:</strong> {item.rhythmFeedback}</p>
                            </div>
                        )}
                        {item.intonationFeedback && (
                            <div className="flex items-start">
                                <i className="fas fa-chart-line w-5 text-center mr-2 text-teal-400 mt-1"></i>
                                <p><strong className="font-semibold text-gray-700 dark:text-gray-200">Intonation:</strong> {item.intonationFeedback}</p>
                            </div>
                        )}
                        <div className="flex items-start">
                            <i className="fas fa-lightbulb w-5 text-center mr-2 text-yellow-400 mt-1"></i>
                            <p><strong className="font-semibold text-gray-700 dark:text-gray-200">Tip:</strong> {item.tip}</p>
                        </div>
                      </div>
                    </td>
                     <td className="p-4">
                        {item.userWaveform && item.nativeWaveform ? (
                            <WaveformVisualizer userData={item.userWaveform} nativeData={item.nativeWaveform} />
                        ) : (
                            <div className="text-center text-xs text-gray-400 dark:text-gray-500">No visual data</div>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Personalized Workout */}
      {result.personalizedWorkout && result.personalizedWorkout.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Your Personalized Workout</h3>
          <ul className="space-y-4">
            {result.personalizedWorkout.map((exercise, index) => (
              <li key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center mb-2">
                      <span className="text-xl">{getExerciseIcon(exercise.type)}</span>
                      <p className="ml-3 font-semibold text-gray-800 dark:text-gray-100">{exercise.type}</p>
                  </div>
                  <div className="flex items-center justify-between">
                      <p className="text-gray-600 dark:text-gray-300 flex-grow pr-4">
                        <StressedSentence sentence={exercise.sentence} />
                      </p>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => onListenToExercise(exercise.sentence)}
                            disabled={audioLoadingSentence !== null || isRecording || isProcessing}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Listen to exercise"
                          >
                            {audioLoadingSentence === exercise.sentence ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-volume-up"></i>}
                          </button>
                          <button
                            onClick={() => onPracticeExercise(exercise.sentence)}
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
      )}
    </div>
  );
};