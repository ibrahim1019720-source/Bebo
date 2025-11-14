import { LanguageOption, SimpleLanguageOption } from './types';

export const AUTO_DETECT_LANGUAGE: LanguageOption = { id: 'auto', name: 'Auto-detect Language', voice: 'Zephyr' };

export const LANGUAGES: LanguageOption[] = [
  AUTO_DETECT_LANGUAGE,
  { id: 'Arabic (Modern Standard)', name: 'Arabic - Modern Standard', voice: 'Zephyr' },
  { id: 'English', name: 'English', voice: 'Zephyr' },
  { id: 'Spanish (Castilian)', name: 'Spanish - Castilian', voice: 'Charon' },
  { id: 'Italian (Standard)', name: 'Italian - Standard', voice: 'Kore' },
  { id: 'French (Standard Parisian)', name: 'French - Standard Parisian', voice: 'Fenrir' },
  { id: 'German (Standard "Hochdeutsch")', name: 'German - Standard', voice: 'Puck' }
];

export const EXPLANATION_LANGUAGES: SimpleLanguageOption[] = [
    { id: 'English', name: 'English' },
    { id: 'Arabic', name: 'Arabic (العربية)' },
    { id: 'Spanish', name: 'Spanish (Español)' },
    { id: 'French', name: 'French (Français)' },
    { id: 'German', name: 'German (Deutsch)' },
    { id: 'Italian', name: 'Italian (Italiano)' },
];