
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { LanguageOption, TranscriptEntry, SimpleLanguageOption } from '../types';
import { LANGUAGES } from '../constants';

// --- Audio Utility Functions ---
// Base64 encoding
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// --- End Audio Utility Functions ---


interface VoiceChatProps {
  selectedLanguage: LanguageOption;
  explanationLanguage: SimpleLanguageOption;
  onChatStateChange: (isActive: boolean) => void;
}

type ChatStatus = 'idle' | 'connecting' | 'connected' | 'error';

export const VoiceChat: React.FC<VoiceChatProps> = ({ selectedLanguage, explanationLanguage, onChatStateChange }) => {
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [chatLanguage, setChatLanguage] = useState<LanguageOption | null>(
    selectedLanguage.id !== 'auto' ? selectedLanguage : null
  );

  const aiRef = useRef<GoogleGenAI | null>(null);
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const chatLanguages = useMemo(() => LANGUAGES.filter(l => l.id !== 'auto'), []);

  useEffect(() => {
    if (process.env.API_KEY) {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return () => {
      // Cleanup on component unmount
      handleStopChat();
    };
  }, []);
  
  // Sync with prop, but not if chat is active.
  useEffect(() => {
      if (status === 'idle' || status === 'error') {
          setChatLanguage(selectedLanguage.id !== 'auto' ? selectedLanguage : null);
      }
  }, [selectedLanguage, status]);


  const handleStartChat = async () => {
    if (status !== 'idle' && status !== 'error') return;
    if (!chatLanguage) {
      setErrorMessage("Please select a specific language to start a voice chat.");
      setStatus('error');
      return;
    }

    setTranscript([]);
    setErrorMessage(null);
    setStatus('connecting');
    onChatStateChange(true);

    if (!aiRef.current) {
        setErrorMessage("AI client not initialized.");
        setStatus('error');
        onChatStateChange(false);
        return;
    }

    const systemInstruction = `You are VoNi, a friendly and encouraging AI accent coach. Your goal is to have a natural conversation with the user in ${chatLanguage.name}. While conversing, listen carefully to their pronunciation. If you notice a mispronounced word, gently and conversationally correct them as part of your response. All your explanations and corrections MUST be in ${explanationLanguage.name}. Keep the conversation flowing naturally.`;

    sessionPromiseRef.current = aiRef.current.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: chatLanguage.voice } } },
        systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          setStatus('connected');
          startMicrophone();
        },
        onmessage: (message: LiveServerMessage) => {
          handleServerMessage(message);
        },
        onerror: (e: ErrorEvent) => {
          console.error('Live session error:', e);
          setErrorMessage('A connection error occurred. Please try again.');
          setStatus('error');
          onChatStateChange(false);
          cleanupAudio();
        },
        onclose: () => {
          // No need to set idle here, handleStopChat does it
        },
      },
    });
  };

  const handleStopChat = useCallback(() => {
      if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(session => {
              session.close();
          }).catch(e => console.error("Error closing session:", e));
          sessionPromiseRef.current = null;
      }
      cleanupAudio();
      setStatus('idle');
      onChatStateChange(false);
  }, []);

  const cleanupAudio = () => {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      
      scriptProcessorRef.current?.disconnect();
      scriptProcessorRef.current = null;

      mediaStreamSourceRef.current?.disconnect();
      mediaStreamSourceRef.current = null;

      inputAudioContextRef.current?.close().catch(e => console.error("Error closing input context:", e));
      inputAudioContextRef.current = null;

      // Don't close output context immediately to allow remaining audio to play
      // It will be re-initialized if needed
  };


  const startMicrophone = async () => {
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      mediaStreamSourceRef.current = source;

      const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob: Blob = {
            data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
        }
      };
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContextRef.current.destination);
    } catch (err) {
      console.error("Microphone access error:", err);
      setErrorMessage("Microphone access denied. Please enable it in your browser settings.");
      setStatus('error');
      onChatStateChange(false);
    }
  };
  
  const handleServerMessage = async (message: LiveServerMessage) => {
    // Handle transcriptions
    if (message.serverContent?.inputTranscription) {
      const { text, isFinal } = message.serverContent.inputTranscription;
      setTranscript(prev => {
        const last = prev[prev.length - 1];
        if (last && last.source === 'user' && !last.isFinal) {
          return [...prev.slice(0, -1), { source: 'user', text, isFinal }];
        }
        return [...prev, { source: 'user', text, isFinal }];
      });
    }
    if (message.serverContent?.outputTranscription) {
      const { text, isFinal } = message.serverContent.outputTranscription;
      setTranscript(prev => {
        const last = prev[prev.length - 1];
        if (last && last.source === 'model' && !last.isFinal) {
          return [...prev.slice(0, -1), { source: 'model', text, isFinal }];
        }
        return [...prev, { source: 'model', text, isFinal }];
      });
    }

    // Handle audio
    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
    if (base64Audio) {
      playAudio(base64Audio);
    }

    // Handle interruption
    if (message.serverContent?.interrupted) {
        for (const source of audioSourcesRef.current.values()) {
            source.stop();
        }
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }
  };

  const playAudio = async (base64String: string) => {
    if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = outputAudioContextRef.current;
    
    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
    const audioBuffer = await decodeAudioData(decode(base64String), ctx, 24000, 1);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    source.addEventListener('ended', () => {
        audioSourcesRef.current.delete(source);
    });

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
    audioSourcesRef.current.add(source);
  };
  
  const handleClearTranscript = () => {
    setTranscript([]);
  };

  const renderTranscript = () => (
    <div className="w-full h-64 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900 rounded-b-lg space-y-4">
      {transcript.map((entry, index) => (
        <div key={index} className={`flex ${entry.source === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl ${entry.source === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'} ${!entry.isFinal ? 'opacity-70' : ''}`}>
            <p><strong>{entry.source === 'user' ? 'You' : 'VoNi'}:</strong> {entry.text}</p>
          </div>
        </div>
      ))}
      {transcript.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Start the chat and begin speaking to see the transcript here.</p>
          </div>
      )}
    </div>
  );
  
  const getButtonText = () => {
      switch (status) {
          case 'idle':
          case 'error':
              return 'Start Chat';
          case 'connecting':
              return 'Connecting...';
          case 'connected':
              return 'End Chat';
      }
  };

  return (
    <div className="w-full space-y-4 pt-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg h-full space-y-4">
             <div className="w-full max-w-xs">
                 <label htmlFor="chat-language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                    Chat Language
                </label>
                <select
                    id="chat-language-select"
                    value={chatLanguage?.id || ''}
                    onChange={(e) => {
                        const newLang = chatLanguages.find(l => l.id === e.target.value);
                        if (newLang) {
                            setChatLanguage(newLang);
                            if(errorMessage) setErrorMessage(null);
                            if(status === 'error') setStatus('idle');
                        }
                    }}
                    disabled={status === 'connecting' || status === 'connected'}
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="" disabled>-- Select a language --</option>
                    {chatLanguages.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                </select>
            </div>
            <button
                onClick={status === 'connected' ? handleStopChat : handleStartChat}
                disabled={status === 'connecting' || !chatLanguage}
                className={`w-36 py-3 px-4 text-white font-semibold rounded-md shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${status === 'connected' ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {status === 'connecting' && <i className="fas fa-spinner fa-spin mr-2"></i>}
                {getButtonText()}
            </button>
            {!chatLanguage && (status === 'idle' || status === 'error') && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Please select a language to begin your chat.
                </p>
            )}
        </div>
      
      {errorMessage && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-center">
            <p>{errorMessage}</p>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
            <h3 className="text-lg font-semibold pl-2 text-gray-800 dark:text-gray-100">Conversation Transcript</h3>
            <button
                onClick={handleClearTranscript}
                disabled={transcript.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Clear transcript"
            >
                <i className="fas fa-trash-alt"></i> Clear Transcript
            </button>
        </div>
        {renderTranscript()}
      </div>
    </div>
  );
};
