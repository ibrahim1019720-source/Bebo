



import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LANGUAGES, EXPLANATION_LANGUAGES } from './constants';
import { AnalysisResult, LanguageOption, SimpleLanguageOption, PracticeSession, ExerciseCategory, UserProfile } from './types';
import { analyzePronunciation, generateNativeAudio, generatePhoneticExplanationAudio } from './services/geminiService';
import { FeedbackDisplay } from './components/FeedbackDisplay';
import { PracticeZone } from './components/PracticeZone';
import { VoiceChat } from './components/VoiceChat';
import { TextChat } from './components/TextChat';
import { ProgressTracker } from './components/ProgressTracker';
import { EXERCISES } from './services/exercises';
import { PasswordProtection } from './components/PasswordProtection';
import './components/WaveformVisualizer'; // Ensure the component is included
import { getDailyExercises } from './services/dailyExerciseService';
import { ProfileManager } from './components/ProfileManager';
import { ProfileSwitcher } from './components/ProfileSwitcher';
import * as profileService from './services/profileService';


// Polyfill for webkitAudioContext
// FIX: Cast window to any to access vendor-prefixed webkitAudioContext, which is not in the default Window type.
window.AudioContext = window.AudioContext || (window as any).webkitAudioContext;


const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isManager, setIsManager] = useState<boolean>(false);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    const [activeTab, setActiveTab] = useState<'coach' | 'practice' | 'chat' | 'text-chat' | 'progress'>('coach');
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(LANGUAGES[0]);
    const [explanationLanguage, setExplanationLanguage] = useState<SimpleLanguageOption>(EXPLANATION_LANGUAGES[0]);
    const [lastDetectedLanguage, setLastDetectedLanguage] = useState<LanguageOption | null>(null);
    const [inputText, setInputText] = useState<string>('');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isChatting, setIsChatting] = useState<boolean>(false);
    const [isTextChatLoading, setIsTextChatLoading] = useState<boolean>(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [nativeAudioUrl, setNativeAudioUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [explanationAudioUrl, setExplanationAudioUrl] = useState<string | null>(null);
    const [explainingKey, setExplainingKey] = useState<string | null>(null);
    const [audioLoadingSentence, setAudioLoadingSentence] = useState<string | null>(null);
    const [recordingSentence, setRecordingSentence] = useState<string | null>(null);
    const [playbackRate, setPlaybackRate] = useState<number>(1);
    const [dailyExercises, setDailyExercises] = useState<ExerciseCategory[]>([]);


    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const referenceTextForRecording = useRef<string>('');
    const explanationAudioRef = useRef<HTMLAudioElement | null>(null);
    const exerciseAudioRef = useRef<HTMLAudioElement | null>(null);
    const nativeAudioRef = useRef<HTMLAudioElement | null>(null);

     // Load profiles from localStorage on startup and handle migration
    useEffect(() => {
        profileService.migrateLegacyHistory();
        const loadedProfiles = profileService.getProfiles();
        setProfiles(loadedProfiles);
        const currentId = profileService.getCurrentUserProfileId();
        if (currentId) {
            const user = loadedProfiles.find(p => p.id === currentId);
            if (user) {
                handleProfileSelect(user, loadedProfiles);
            }
        }
    }, []);
    
    // When currentUser changes, update language preferences from their profile
    useEffect(() => {
        if (currentUser) {
            const lang = LANGUAGES.find(l => l.id === currentUser.lastSelectedLanguageId) || LANGUAGES[0];
            const expLang = EXPLANATION_LANGUAGES.find(l => l.id === currentUser.lastExplanationLanguageId) || EXPLANATION_LANGUAGES[0];
            setSelectedLanguage(lang);
            setExplanationLanguage(expLang);
        }
    }, [currentUser]);


    // Generate daily exercises when language changes
    useEffect(() => {
        const allExercisesForLang = EXERCISES[selectedLanguage.id] || [];
        if (allExercisesForLang.length > 0) {
            const today = new Date().toDateString();
            setDailyExercises(getDailyExercises(allExercisesForLang, today));
        } else {
            setDailyExercises([]);
        }
    }, [selectedLanguage]);


    const handleClearHistory = useCallback(() => {
        if (!currentUser) return;
        if (window.confirm(`Are you sure you want to clear all practice history for ${currentUser.name}? This action cannot be undone.`)) {
            const updatedUser = { ...currentUser, practiceHistory: [] };
            setCurrentUser(updatedUser);

            const updatedProfiles = profiles.map(p => p.id === updatedUser.id ? updatedUser : p);
            setProfiles(updatedProfiles);
            profileService.saveProfiles(updatedProfiles);
        }
    }, [currentUser, profiles]);

    const addSessionToHistory = (newSession: PracticeSession) => {
        if (!currentUser) return;

        const updatedHistory = [newSession, ...currentUser.practiceHistory];
        const updatedUser = { ...currentUser, practiceHistory: updatedHistory };

        setCurrentUser(updatedUser);
        const updatedProfiles = profiles.map(p => p.id === updatedUser.id ? updatedUser : p);
        setProfiles(updatedProfiles);
        profileService.saveProfiles(updatedProfiles);
    };

    const startRecording = useCallback(() => {
        if (isRecording) return;
        setErrorMessage(null);
        setLastDetectedLanguage(null);

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunksRef.current.push(event.data);
                });

                mediaRecorder.addEventListener("stop", async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = async () => {
                        const base64Audio = (reader.result as string).split(',')[1];
                        setIsProcessing(true);
                        try {
                            const result = await analyzePronunciation(base64Audio, selectedLanguage.id, LANGUAGES, referenceTextForRecording.current, explanationLanguage.id);
                            setAnalysisResult(result);
                            
                            let sessionLanguage: LanguageOption | null = null;
                            if (result.detectedLanguage) {
                                sessionLanguage = LANGUAGES.find(l => l.id === result.detectedLanguage) || null;
                            } else if (selectedLanguage.id !== 'auto') {
                                sessionLanguage = selectedLanguage;
                            }

                            if (sessionLanguage && typeof result.overallScore === 'number' && typeof result.fluencyScore === 'number') {
                                const newSession: PracticeSession = {
                                    id: new Date().toISOString(),
                                    date: new Date().toISOString(),
                                    score: result.overallScore,
                                    fluencyScore: result.fluencyScore,
                                    language: sessionLanguage.name,
                                    referenceText: referenceTextForRecording.current || 'Recorded Speech',
                                    incorrectWords: result.detailedFeedback.filter(f => !f.isCorrect),
                                };
                                addSessionToHistory(newSession);
                            }

                            if (result.detectedLanguage) {
                                const foundLang = LANGUAGES.find(l => l.id === result.detectedLanguage);
                                if (foundLang) {
                                    setLastDetectedLanguage(foundLang);
                                    if(recordingSentence === null) { // Only switch language if not in a practice session
                                        setSelectedLanguage(foundLang);
                                    }
                                } else {
                                    setErrorMessage(`AI detected ${result.detectedLanguage}, but it's not a supported language.`);
                                    setLastDetectedLanguage(null);
                                }
                            } else if (selectedLanguage.id !== 'auto') {
                                setLastDetectedLanguage(selectedLanguage);
                            }

                        } catch (error: any) {
                            setErrorMessage(error.message || 'An unknown error occurred.');
                        } finally {
                            setIsProcessing(false);
                            referenceTextForRecording.current = '';
                            setRecordingSentence(null);
                             // Stop all tracks on the stream
                            stream.getTracks().forEach(track => track.stop());
                        }
                    };
                });

                mediaRecorder.start();
                setIsRecording(true);
            })
            .catch(err => {
                console.error("Error accessing microphone:", err);
                setErrorMessage("Microphone access was denied. Please allow microphone access in your browser settings.");
                setRecordingSentence(null);
                setIsRecording(false);
            });
    }, [isRecording, selectedLanguage, recordingSentence, explanationLanguage.id, currentUser]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const handleRecordClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            referenceTextForRecording.current = ''; // Clear reference text for direct recording
            setNativeAudioUrl(null);
            setAnalysisResult(null);
            startRecording();
        }
    };
    
    const handleAnalyzeText = async () => {
        if (!inputText.trim() || selectedLanguage.id === 'auto') {
            setErrorMessage("Please select a specific language and enter some text to analyze.");
            return;
        }
        setErrorMessage(null);
        setAnalysisResult(null);
        setIsProcessing(true);
        try {
            const base64Audio = await generateNativeAudio(inputText, selectedLanguage);
            const audioSrc = `data:audio/wav;base64,${base64Audio}`;
            setNativeAudioUrl(audioSrc);
            referenceTextForRecording.current = inputText;
        } catch (error: any) {
            setErrorMessage(error.message || 'Failed to generate audio.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePhoneticClick = async (word: string, phonetic: string, key: string) => {
        if (explainingKey) return; // Prevent multiple requests while one is active

        const languageForExplanation = lastDetectedLanguage || (selectedLanguage.id !== 'auto' ? selectedLanguage : null);

        if (!languageForExplanation) {
            setErrorMessage("Could not determine the language for this explanation. Please try the analysis again.");
            return;
        }

        setErrorMessage(null);
        setExplainingKey(key);
        setExplanationAudioUrl(null);

        try {
            const base64Audio = await generatePhoneticExplanationAudio(word, phonetic, languageForExplanation, explanationLanguage.id);
            const audioSrc = `data:audio/wav;base64,${base64Audio}`;
            setExplanationAudioUrl(audioSrc);
        } catch (error: any) {
            setErrorMessage(error.message || 'Failed to generate pronunciation guide.');
            setExplainingKey(null); // Reset on error
        }
    };
    
    const handleListenToExercise = async (sentence: string) => {
        const languageForAudio = lastDetectedLanguage || (selectedLanguage.id !== 'auto' ? selectedLanguage : null);
        if (!languageForAudio) {
            setErrorMessage("Language not determined. Please run an analysis first.");
            return;
        }
        setAudioLoadingSentence(sentence);
        setErrorMessage(null);
        try {
            const base64Audio = await generateNativeAudio(sentence, languageForAudio);
            const audioSrc = `data:audio/wav;base64,${base64Audio}`;
            if (exerciseAudioRef.current) {
                exerciseAudioRef.current.src = audioSrc;
                exerciseAudioRef.current.playbackRate = playbackRate;
                exerciseAudioRef.current.play();
                exerciseAudioRef.current.onended = () => {
                    setAudioLoadingSentence(null);
                };
                 exerciseAudioRef.current.onerror = () => {
                    setErrorMessage("Failed to play exercise audio.");
                    setAudioLoadingSentence(null);
                };
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'Failed to generate exercise audio.');
            setAudioLoadingSentence(null);
        }
    };
    
    const handlePracticeExercise = (sentence: string) => {
        if (isRecording && recordingSentence === sentence) {
            stopRecording();
        } else if (!isRecording) {
            setAnalysisResult(null);
            setNativeAudioUrl(null);
            referenceTextForRecording.current = sentence;
            setRecordingSentence(sentence);
            startRecording();
        }
    };

    useEffect(() => {
        if (explanationAudioUrl && explanationAudioRef.current) {
            explanationAudioRef.current.play();
            explanationAudioRef.current.onended = () => {
                setExplainingKey(null);
            };
        }
    }, [explanationAudioUrl]);

    useEffect(() => {
        if (nativeAudioRef.current) {
            nativeAudioRef.current.playbackRate = playbackRate;
        }
        if (exerciseAudioRef.current) {
            exerciseAudioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    const updateProfilePreferences = (updatedUser: UserProfile) => {
        setCurrentUser(updatedUser);
        const updatedProfiles = profiles.map(p => p.id === updatedUser.id ? updatedUser : p);
        setProfiles(updatedProfiles);
        profileService.saveProfiles(updatedProfiles);
    };
    
    // --- Profile Handlers ---
    const handleProfileSelect = (profile: UserProfile, currentProfiles: UserProfile[]) => {
        setCurrentUser(profile);
        profileService.setCurrentUserProfileId(profile.id);
        setProfiles(currentProfiles); // Ensure profiles state is in sync
    };

    const handleCreateProfile = (name: string) => {
        const newProfile = profileService.addProfile(name);
        if (newProfile) {
            const updatedProfiles = [...profiles, newProfile];
            setProfiles(updatedProfiles);
            handleProfileSelect(newProfile, updatedProfiles);
        }
    };

    const handleSignOut = () => {
        setCurrentUser(null);
        profileService.clearCurrentUserProfileId();
    };

    const Header = () => (
        <div className="text-center p-6">
            <h1 className="text-6xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">VoNi</h1>
            <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Say it Better.</p>
        </div>
    );
    
    const isUIInteractionDisabled = isRecording || isProcessing || isChatting || isTextChatLoading;

    if (!isAuthenticated) {
        return <PasswordProtection onAuthenticate={(managerStatus) => {
            setIsAuthenticated(true);
            setIsManager(managerStatus);
        }} />;
    }

    if (!currentUser) {
        return <ProfileManager 
            profiles={profiles} 
            onProfileSelect={(p) => handleProfileSelect(p, profiles)} 
            onCreateProfile={handleCreateProfile} 
            isManager={isManager} 
        />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8">
             <div className="w-full max-w-4xl relative">
                <Header />
                <div className="absolute top-6 right-0 z-10">
                    <ProfileSwitcher 
                        currentUser={currentUser} 
                        profiles={profiles} 
                        isManager={isManager}
                        onSwitchProfile={(id) => {
                            const profile = profiles.find(p => p.id === id);
                            if (profile) handleProfileSelect(profile, profiles);
                        }}
                        onAddProfile={handleSignOut} // Go to manager to add new profile
                        onSignOut={handleSignOut}
                    />
                </div>
            </div>

            <main className="w-full max-w-4xl mx-auto">
                {isManager && (
                    <div className="flex justify-center items-center text-center mb-4 gap-4">
                        <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-yellow-900 dark:text-yellow-300 flex items-center">
                            <i className="fas fa-user-shield mr-2"></i>Manager Mode
                        </span>
                         <button
                            onClick={() => alert('App content has been published successfully!')}
                            className="px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-blue-500 flex items-center"
                            aria-label="Publish updates"
                        >
                            <i className="fas fa-cloud-upload-alt mr-2"></i>
                            Publish
                        </button>
                    </div>
                )}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Language to Practice
                            </label>
                            <select
                                id="language-select"
                                value={selectedLanguage.id}
                                onChange={(e) => {
                                    const newLang = LANGUAGES.find(l => l.id === e.target.value) || LANGUAGES[0];
                                    setSelectedLanguage(newLang);
                                    setAnalysisResult(null);
                                    setLastDetectedLanguage(null);
                                    setErrorMessage(null);
                                    setNativeAudioUrl(null);
                                    if (currentUser) {
                                        updateProfilePreferences({ ...currentUser, lastSelectedLanguageId: newLang.id });
                                    }
                                }}
                                disabled={isUIInteractionDisabled}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {LANGUAGES.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="explanation-language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Explanation Language
                            </label>
                            <select
                                id="explanation-language-select"
                                value={explanationLanguage.id}
                                onChange={(e) => {
                                    const newExpLang = EXPLANATION_LANGUAGES.find(l => l.id === e.target.value) || EXPLANATION_LANGUAGES[0];
                                    setExplanationLanguage(newExpLang);
                                     if (currentUser) {
                                        updateProfilePreferences({ ...currentUser, lastExplanationLanguageId: newExpLang.id });
                                    }
                                }}
                                disabled={isUIInteractionDisabled}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {EXPLANATION_LANGUAGES.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Playback Speed
                            </label>
                            <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1">
                                {[0.5, 0.75, 1, 1.5].map(rate => (
                                    <button
                                        key={rate}
                                        onClick={() => setPlaybackRate(rate)}
                                        disabled={isUIInteractionDisabled}
                                        className={`w-full py-2 px-2 text-sm font-semibold rounded-md transition ${playbackRate === rate ? 'bg-indigo-600 text-white shadow-sm' : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('coach')}
                            className={`flex-shrink-0 py-3 px-4 sm:px-6 font-semibold transition-colors ${activeTab === 'coach' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            disabled={isUIInteractionDisabled}
                        >
                           <i className="fas fa-user-graduate mr-2"></i> Accent Coach
                        </button>
                        <button
                            onClick={() => setActiveTab('practice')}
                            className={`flex-shrink-0 py-3 px-4 sm:px-6 font-semibold transition-colors ${activeTab === 'practice' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                             disabled={isUIInteractionDisabled}
                        >
                            <i className="fas fa-dumbbell mr-2"></i> Practice
                        </button>
                        <button
                            onClick={() => setActiveTab('progress')}
                            className={`flex-shrink-0 py-3 px-4 sm:px-6 font-semibold transition-colors ${activeTab === 'progress' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            disabled={isUIInteractionDisabled}
                        >
                            <i className="fas fa-chart-line mr-2"></i> Progress
                        </button>
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-shrink-0 py-3 px-4 sm:px-6 font-semibold transition-colors ${activeTab === 'chat' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            disabled={isRecording || isProcessing}
                        >
                            <i className="fas fa-comments mr-2"></i> Voice Chat
                        </button>
                         <button
                            onClick={() => setActiveTab('text-chat')}
                            className={`flex-shrink-0 py-3 px-4 sm:px-6 font-semibold transition-colors ${activeTab === 'text-chat' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            disabled={isUIInteractionDisabled}
                        >
                            <i className="fas fa-keyboard mr-2"></i> Text Chat
                        </button>
                    </div>

                    {activeTab === 'coach' && (
                        <div className="pt-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Left Side: Record & Speak */}
                                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg h-full">
                                    <button
                                        onClick={handleRecordClick}
                                        disabled={isProcessing || recordingSentence !== null || isChatting}
                                        className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'} ${isProcessing || recordingSentence !== null || isChatting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-3xl`}></i>
                                    </button>
                                    <p className="mt-4 font-semibold text-lg text-gray-800 dark:text-gray-100">
                                        {isRecording ? 'Stop Recording' : (isProcessing ? 'Processing...' : 'Record & Speak')}
                                    </p>
                                </div>

                                {/* Right Side: Analyze Text */}
                                <div className="flex flex-col p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg h-full">
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Or type text here to hear a native speaker..."
                                        className="w-full flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 transition mb-4 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                        rows={4}
                                        disabled={selectedLanguage.id === 'auto' || recordingSentence !== null || isRecording || isChatting}
                                    />
                                    <button
                                        onClick={handleAnalyzeText}
                                        disabled={isProcessing || isRecording || selectedLanguage.id === 'auto' || recordingSentence !== null || isChatting}
                                        className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? 'Generating...' : 'Analyze This Text'}
                                    </button>
                                     {selectedLanguage.id === 'auto' && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                            Select a specific language to analyze text.
                                        </p>
                                    )}
                                </div>
                            </div>
                            {nativeAudioUrl && (
                                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-center">
                                    <p className="font-semibold mb-2 text-indigo-800 dark:text-indigo-200">Listen to the native pronunciation, then record your version:</p>
                                    <audio ref={nativeAudioRef} controls src={nativeAudioUrl} className="mx-auto" />
                                    <button 
                                        onClick={handleRecordClick}
                                        disabled={isProcessing || isRecording || isChatting}
                                        className="mt-4 py-2 px-5 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <i className="fas fa-microphone mr-2"></i>
                                        {isRecording ? 'Recording...' : 'Record My Version'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'practice' && (
                        <PracticeZone
                            exercises={dailyExercises}
                            onListen={handleListenToExercise}
                            onPractice={handlePracticeExercise}
                            audioLoadingSentence={audioLoadingSentence}
                            recordingSentence={recordingSentence}
                            isRecording={isRecording}
                            isProcessing={isProcessing}
                            selectedLanguage={selectedLanguage.id}
                        />
                    )}
                     {activeTab === 'progress' && (
                        <ProgressTracker
                            history={currentUser.practiceHistory || []}
                            isManager={isManager}
                            onClearHistory={handleClearHistory}
                        />
                    )}
                    {activeTab === 'chat' && (
                       <VoiceChat
                           selectedLanguage={selectedLanguage}
                           explanationLanguage={explanationLanguage}
                           onChatStateChange={setIsChatting}
                       />
                    )}
                    {activeTab === 'text-chat' && (
                       <TextChat
                           selectedLanguage={selectedLanguage}
                           explanationLanguage={explanationLanguage}
                           onLoadingStateChange={setIsTextChatLoading}
                       />
                    )}

                </div>

                {isProcessing && !isChatting && activeTab !== 'text-chat' && activeTab !== 'chat' && activeTab !== 'progress' && (
                    <div className="text-center mt-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">
                           { recordingSentence !== null ? `Analyzing your practice attempt...` : `AI is analyzing your accent... this might take a moment.` }
                        </p>
                    </div>
                )}

                {errorMessage && (
                    <div className="mt-8 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-center">
                        <p>{errorMessage}</p>
                    </div>
                )}
                
                {!isUIInteractionDisabled && activeTab === 'coach' && (
                     <FeedbackDisplay 
                        result={analysisResult} 
                        onPhoneticClick={handlePhoneticClick} 
                        explainingKey={explainingKey}
                        onListenToExercise={handleListenToExercise}
                        onPracticeExercise={handlePracticeExercise}
                        audioLoadingSentence={audioLoadingSentence}
                        recordingSentence={recordingSentence}
                        isRecording={isRecording}
                        isProcessing={isProcessing}
                    />
                )}
               
                
                <audio ref={explanationAudioRef} src={explanationAudioUrl || ''} className="hidden" />
                <audio ref={exerciseAudioRef} className="hidden" />
            </main>
        </div>
    );
};

export default App;