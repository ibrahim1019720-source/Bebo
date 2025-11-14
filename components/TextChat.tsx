
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { LanguageOption, ChatMessage, SimpleLanguageOption } from '../types';

interface TextChatProps {
  selectedLanguage: LanguageOption;
  explanationLanguage: SimpleLanguageOption;
  onLoadingStateChange: (isLoading: boolean) => void;
}

export const TextChat: React.FC<TextChatProps> = ({ selectedLanguage, explanationLanguage, onLoadingStateChange }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    onLoadingStateChange(isLoading);
  }, [isLoading, onLoadingStateChange]);

  const initializeChat = useCallback(() => {
    if (!aiRef.current) {
        if (process.env.API_KEY) {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } else {
            setError("API Key not configured.");
            return;
        }
    }

    if (selectedLanguage.id === 'auto') {
      setMessages([]);
      setError("Please select a specific language to start a text chat.");
      chatRef.current = null;
      return;
    }

    setError(null);
    const systemInstruction = `You are VoNi, a friendly and helpful language writing coach. The user is learning ${selectedLanguage.name}. Your task is to analyze the user's text for grammatical errors, awkward phrasing, and vocabulary choice. Provide corrections and clear, concise explanations, with all explanations being in ${explanationLanguage.name}. If the text is correct, praise the user and perhaps offer a more stylistic alternative. Keep your tone encouraging and supportive. Respond only with your coaching feedback.`;
    
    chatRef.current = aiRef.current.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
      },
    });

    setMessages([
      { role: 'model', text: `Hi! I'm ready to help you with your ${selectedLanguage.name} writing. Type a sentence or a paragraph, and I'll give you feedback.` }
    ]);
  }, [selectedLanguage, explanationLanguage]);


  // Initialize AI client and Chat session
  useEffect(() => {
    initializeChat();
  }, [initializeChat]);
  
  const handleClearChat = () => {
    initializeChat();
  };


  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || isLoading || !chatRef.current) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatRef.current.sendMessage({ message: userInput });
      const modelMessage: ChatMessage = { role: 'model', text: response.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (e: any) {
      console.error("Text chat error:", e);
      setError("Sorry, I encountered an error. Please try again.");
      setMessages(prev => prev.slice(0, -1)); // Remove the user's message if the call fails
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (selectedLanguage.id === 'auto') {
     return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-fade-in pt-6">
        <p className="text-gray-600 dark:text-gray-300">Please select a specific language to use the text chat feature.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[60vh] pt-6 animate-fade-in">
      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
        <h3 className="text-lg font-semibold pl-2 text-gray-800 dark:text-gray-100">Writing Coach</h3>
        <button
            onClick={handleClearChat}
            disabled={messages.length <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear chat history"
        >
            <i className="fas fa-trash-alt"></i> Clear Chat
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'}`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-xs p-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

       {error && (
        <div className="p-2 text-center text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg flex items-center">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !userInput.trim()}
          className="ml-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </button>
      </div>
    </div>
  );
};
