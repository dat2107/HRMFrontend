import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import vi from './vi'
import en from './en'
import jp from './jp'

const savedLang = localStorage.getItem('hrm_lang') || 'vi'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
      jp: { translation: jp },
    },
    lng: savedLang,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
