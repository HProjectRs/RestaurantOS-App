import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import fr from './fr.json';
import { useSettingsStore } from '../store/settingsStore';

const language = useSettingsStore.getState().language || 'ar';

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    fr: { translation: fr },
  },
  lng: language,
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
});


useSettingsStore.subscribe((state) => {
  if (state.language && state.language !== i18n.language) {
    i18n.changeLanguage(state.language);
  }
});

export default i18n;
