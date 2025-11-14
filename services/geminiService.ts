import { GoogleGenAI, Type, Modality } from '@google/genai';
import { AnalysisResult, LanguageOption } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: { type: Type.NUMBER, description: "A score from 0 to 100 representing pronunciation accuracy." },
        fluencyScore: { type: Type.NUMBER, description: "A score from 0 to 100 representing the speaker's fluency, considering pace, pauses, and rhythm." },
        feedbackSummary: { type: Type.STRING, description: "A brief, encouraging summary of the user's performance." },
        detailedFeedback: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    userPronunciation: { type: Type.STRING, description: "Simplified phonetic spelling of the user's pronunciation." },
                    nativePronunciation: { type: Type.STRING, description: "Simplified phonetic spelling of the correct native pronunciation." },
                    tip: { type: Type.STRING, description: "Actionable tip for improvement." },
                    userWaveform: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Array of 25 numbers (0-100) representing the user's amplitude envelope." },
                    nativeWaveform: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Array of 25 numbers (0-100) representing the native amplitude envelope." },
                    problemPhonemeUser: { type: Type.STRING, description: "The specific mispronounced phoneme from the user's speech, if any." },
                    problemPhonemeNative: { type: Type.STRING, description: "The corresponding correct native phoneme, if any." },
                    intonationFeedback: { type: Type.STRING, description: "Specific feedback on the user's intonation for this word (e.g., 'rising tone was flat'). Only include if there is a notable issue." },
                    rhythmFeedback: { type: Type.STRING, description: "Specific feedback on the user's rhythm and stress for this word (e.g., 'stress on the wrong syllable'). Only include if there is a notable issue." }
                },
                required: ['word', 'isCorrect', 'userPronunciation', 'nativePronunciation', 'tip']
            }
        },
        personalizedWorkout: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['Minimal Pair', 'Tongue Twister', 'Repetition Phrase', 'Fill in the Blanks', 'Sentence Stress Practice'] },
                    sentence: { type: Type.STRING }
                },
                required: ['type', 'sentence']
            }
        },
        detectedLanguage: { type: Type.STRING, description: "The language detected from the audio, matching one of the provided language IDs. Only present when auto-detecting." }
    },
    required: ['overallScore', 'fluencyScore', 'feedbackSummary', 'detailedFeedback', 'personalizedWorkout']
};

const fileToGenerativePart = (base64: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64,
            mimeType,
        },
    };
};

export const analyzePronunciation = async (audioBase64: string, language: string, availableLanguages: LanguageOption[], referenceText?: string, explanationLanguage: string = 'English'): Promise<AnalysisResult> => {
    const audioPart = fileToGenerativePart(audioBase64, "audio/webm");
    const explanationInstruction = `All textual feedback you provide (like feedbackSummary and tips) MUST be in ${explanationLanguage}.`;
    const waveformInstruction = `For each word in 'detailedFeedback', you MUST also provide 'userWaveform' and 'nativeWaveform' arrays. Each array should contain exactly 25 numbers between 0 and 100, representing a simplified amplitude envelope of the spoken word over time. This data is crucial for visualizing the pronunciation rhythm and stress. The native waveform should represent the ideal, standard pronunciation.`;
    const granularFeedbackInstruction = `For incorrectly pronounced words, identify the single key phoneme that was mispronounced and provide it in 'problemPhonemeUser' and the correct version in 'problemPhonemeNative'. Also, provide specific, granular feedback on intonation and rhythm in the 'intonationFeedback' and 'rhythmFeedback' fields, but ONLY if there is a distinct issue with them for a particular word. Otherwise, leave these fields null or undefined.`;
    const fluencyInstruction = `Also, evaluate the user's fluency. Provide a 'fluencyScore' from 0 to 100 based on their speaking rate, use of filler words (like 'um', 'ah'), unnatural pauses, and the overall rhythm and flow of the speech. A higher score indicates more natural, fluid speech.`;

    let textPrompt: string;

    if (language === 'auto') {
        const supportedLanguages = availableLanguages.filter(l => l.id !== 'auto').map(l => `"${l.id}"`).join(', ');
        textPrompt = `You are "VoNi," a friendly and encouraging language tutor.
${explanationInstruction}
${waveformInstruction}
${granularFeedbackInstruction}
${fluencyInstruction}
First, analyze the provided audio recording to identify which language the user is speaking. The language MUST be one of the following: ${supportedLanguages}.
Once you have identified the language, set the 'detectedLanguage' field in your JSON response to the corresponding language ID string (e.g., "English").
Then, as an expert in the detected language, perform the rest of the analysis.
Transcribe the user's speech. ${referenceText ? `The user was attempting to say: "${referenceText}".` : ''}
Compare the user's pronunciation, intonation, and rhythm for each word against the standard native pronunciation for the DETECTED language.
Provide feedback in a supportive tone. Your response MUST be a JSON object that strictly adheres to the provided schema.
For 'detailedFeedback', if a word is pronounced correctly, set 'isCorrect' to true and provide positive reinforcement in the 'tip' field.
For incorrectly pronounced words, provide simplified phonetic spellings for both user and native pronunciations, and a clear, actionable tip.
Generate 3-5 personalized workout exercises based on the user's recurring mistakes.
Do not output any markdown formatting (e.g., \`\`\`json).
If you cannot confidently identify the language from the list, your entire response should be a JSON object with only the 'feedbackSummary' field set to a message like 'Sorry, I couldn't identify the language you are speaking. Please select a language and try again.', and the other fields set to empty or default values.`;
    } else {
        textPrompt = `You are "VoNi," a friendly and encouraging language tutor.
${explanationInstruction}
${waveformInstruction}
${granularFeedbackInstruction}
${fluencyInstruction}
The user is learning ${language}.
Analyze the provided audio recording.
First, transcribe the user's speech. ${referenceText ? `The user was attempting to say: "${referenceText}".` : ''}
Then, compare the user's pronunciation, intonation, and rhythm for each word against the standard native pronunciation for ${language}.
Provide feedback in a supportive tone. Your response MUST be a JSON object that strictly adheres to the provided schema.
For 'detailedFeedback', if a word is pronounced correctly, set 'isCorrect' to true and provide positive reinforcement in the 'tip' field.
For incorrectly pronounced words, provide simplified phonetic spellings for both user and native pronunciations, and a clear, actionable tip.
Generate 3-5 personalized workout exercises based on the user's recurring mistakes.
Do not output any markdown formatting (e.g., \`\`\`json).`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [ {text: textPrompt}, audioPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema
        }
    });

    try {
        const resultText = response.text.trim();
        return JSON.parse(resultText) as AnalysisResult;
    } catch (e) {
        console.error("Failed to parse Gemini response:", response.text);
        throw new Error("Received an invalid response from the AI. Please try again.");
    }
};

export const generateNativeAudio = async (text: string, language: LanguageOption): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this in a clear, standard ${language.name} accent: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: language.voice },
                },
            },
        },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Could not generate audio. Please try again.");
    }
    return base64Audio;
};

export const generatePhoneticExplanationAudio = async (word: string, phonetic: string, language: LanguageOption, explanationLanguage: string = 'English'): Promise<string> => {
    const prompt = `You are a helpful accent coach. The user is learning ${language.name}.
Speaking in a friendly and clear tone IN ${explanationLanguage}, explain how to pronounce the word "${word}", which has the simplified phonetic spelling "${phonetic}".
Break down the key sounds simply. Keep the explanation concise, under 20 seconds.
Your explanation MUST be grammatically correct and sound natural in ${explanationLanguage}. Avoid overly technical linguistic terms.
Focus on practical advice about mouth shape, tongue position, and airflow if relevant. The goal is maximum clarity for a language learner.
For example, if the word is 'Apple', phonetic is 'A-puhl', and the explanation language is Spanish, you could say in Spanish: "Para decir 'Apple', comienza con un sonido 'A' abierto, como en la palabra 'gato'. Luego, un sonido 'p' nítido. Termina con 'uhl', manteniendo la lengua relajada."
Now, provide the explanation for the given word and phonetic spelling, IN ${explanationLanguage}.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: language.voice },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Could not generate phonetic guide audio. Please try again.");
    }
    return base64Audio;
};