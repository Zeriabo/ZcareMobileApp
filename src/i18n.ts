import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import en from './locales/en.json';
import fi from './locales/fi.json';

const LANGUAGE_KEY = '@zcare_language';

// Get saved language or default to English
const getInitialLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || 'en';
  } catch (error) {
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fi: { translation: fi },
      ar: { translation: ar },
    },
    lng: 'en', // Will be overridden by saved preference
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language preference
getInitialLanguage().then((language) => {
  i18n.changeLanguage(language);
});

// Save language preference when changed
i18n.on('languageChanged', async (lng) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
});

export default i18n;
